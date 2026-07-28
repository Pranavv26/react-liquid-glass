import { useEffect, useRef, useCallback } from 'react'
import { useGlassStore } from '../store/glassStore'
import glassFragSrc from '../shaders/glassFragment'
import vertSrc from '../shaders/glassVertex'
import { blurVertex, blurHorizontal, blurVertical } from '../shaders/blurFragment'
import { getShapeTypeIndex } from '../lib/sdf'
import { makeBackgroundCanvas, isBackgroundId } from '../lib/backgrounds'

function createShader(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s))
  }
  return s
}

function createProgram(gl: WebGL2RenderingContext, vert: string, frag: string) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vert)
  const fs = createShader(gl, gl.FRAGMENT_SHADER, frag)
  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog))
  }
  return prog
}

function uploadCanvasAsTexture(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return tex
}

function uploadImageAsTexture(gl: WebGL2RenderingContext, img: HTMLImageElement) {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return tex
}

function createFbo(gl: WebGL2RenderingContext, w: number, h: number) {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { tex, fbo }
}

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  return [
    parseInt(c.substring(0, 2), 16) / 255,
    parseInt(c.substring(2, 4), 16) / 255,
    parseInt(c.substring(4, 6), 16) / 255,
  ]
}

const IDLE_FRAMES_BEFORE_PAUSE = 5

export default function GlassCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const glRef = useRef<WebGL2RenderingContext | null>(null)
  const progRef = useRef<WebGLProgram | null>(null)
  const blurHProgRef = useRef<WebGLProgram | null>(null)
  const blurVProgRef = useRef<WebGLProgram | null>(null)
  const bgTexRef = useRef<WebGLTexture | null>(null)
  const bgSizeRef = useRef({ w: 1920, h: 1080 })
  const fbo1Ref = useRef<{ tex: WebGLTexture | null; fbo: WebGLFramebuffer | null }>({ tex: null, fbo: null })
  const fbo2Ref = useRef<{ tex: WebGLTexture | null; fbo: WebGLFramebuffer | null }>({ tex: null, fbo: null })
  const animRef = useRef(0)
  const dirtyRef = useRef(true)
  const idleFramesRef = useRef(0)
  const sizeRef = useRef({ w: 0, h: 0 })
  const prevParamsRef = useRef('')

  const render = useCallback(() => {
    const gl = glRef.current
    const prog = progRef.current
    const blurH = blurHProgRef.current
    const blurV = blurVProgRef.current
    if (!gl || !prog || !blurH || !blurV) return

    const state = useGlassStore.getState()
    const { position, size, params, shapeType, background } = state
    const { w, h } = sizeRef.current

    gl.viewport(0, 0, w, h)

    const blurAmount = params.blur
    const blurRadius = Math.max(1, blurAmount * 0.5)

    if (blurAmount > 0.5 && bgTexRef.current && fbo1Ref.current.tex && fbo2Ref.current.tex) {
      gl.useProgram(blurH)
      gl.uniform2f(gl.getUniformLocation(blurH, 'u_resolution'), w, h)
      gl.uniform1f(gl.getUniformLocation(blurH, 'u_blurRadius'), blurRadius)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, bgTexRef.current)
      gl.uniform1i(gl.getUniformLocation(blurH, 'u_texture'), 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1Ref.current.fbo)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      gl.useProgram(blurV)
      gl.uniform2f(gl.getUniformLocation(blurV, 'u_resolution'), w, h)
      gl.uniform1f(gl.getUniformLocation(blurV, 'u_blurRadius'), blurRadius)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, fbo1Ref.current.tex)
      gl.uniform1i(gl.getUniformLocation(blurV, 'u_texture'), 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo2Ref.current.fbo)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.useProgram(prog)

    const cx = position.x + size.width / 2
    const cy = position.y + size.height / 2

    const imgAspect = bgSizeRef.current.w / bgSizeRef.current.h
    const canvasAspect = w / h
    let bgScaleX = 1
    let bgScaleY = 1
    if (imgAspect > canvasAspect) {
      bgScaleX = imgAspect / canvasAspect
    } else {
      bgScaleY = canvasAspect / imgAspect
    }

    gl.uniform2f(gl.getUniformLocation(prog, 'u_resolution'), w, h)
    gl.uniform2f(gl.getUniformLocation(prog, 'u_bgScale'), bgScaleX, bgScaleY)
    gl.uniform2f(gl.getUniformLocation(prog, 'u_glassCenter'), cx, cy)
    gl.uniform2f(gl.getUniformLocation(prog, 'u_glassSize'), size.width, size.height)
    gl.uniform1f(gl.getUniformLocation(prog, 'u_cornerRadius'), params.cornerRadius)
    gl.uniform1f(gl.getUniformLocation(prog, 'u_refractionStrength'), params.refractionStrength / 100)
    gl.uniform1f(gl.getUniformLocation(prog, 'u_rimWidth'), params.rimWidth)
    gl.uniform1f(gl.getUniformLocation(prog, 'u_blurAmount'), params.blur)
    gl.uniform1f(gl.getUniformLocation(prog, 'u_saturation'), params.saturation)
    const [tr, tg, tb] = hexToRgb(params.tintColor)
    gl.uniform3f(gl.getUniformLocation(prog, 'u_tintColor'), tr, tg, tb)
    gl.uniform1f(gl.getUniformLocation(prog, 'u_tintOpacity'), params.tintOpacity)
    gl.uniform1f(gl.getUniformLocation(prog, 'u_chromaticAberration'), params.chromaticAberration / 20)
    gl.uniform1f(gl.getUniformLocation(prog, 'u_specularIntensity'), params.specularIntensity)
    gl.uniform1f(gl.getUniformLocation(prog, 'u_highlightBoost'), state.highlightBoost)
    gl.uniform2f(gl.getUniformLocation(prog, 'u_lightDir'), -0.6, 0.8)
    gl.uniform1i(gl.getUniformLocation(prog, 'u_shapeType'), getShapeTypeIndex(shapeType))
    gl.uniform1i(gl.getUniformLocation(prog, 'u_debugShowDisplacement'), state.debugShowDisplacement ? 1 : 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, bgTexRef.current)
    gl.uniform1i(gl.getUniformLocation(prog, 'u_background'), 0)

    if (blurAmount > 0.5 && fbo2Ref.current.tex) {
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, fbo2Ref.current.tex)
      gl.uniform1i(gl.getUniformLocation(prog, 'u_blurred'), 1)
    } else {
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, bgTexRef.current)
      gl.uniform1i(gl.getUniformLocation(prog, 'u_blurred'), 1)
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    const paramsKey = `${cx},${cy},${JSON.stringify(params)},${shapeType},${background},${state.highlightBoost},${state.debugShowDisplacement}`
    if (paramsKey === prevParamsRef.current && !state.isDragging) {
      idleFramesRef.current++
      if (idleFramesRef.current > IDLE_FRAMES_BEFORE_PAUSE) {
        dirtyRef.current = false
      }
    } else {
      dirtyRef.current = true
      idleFramesRef.current = 0
      prevParamsRef.current = paramsKey
    }

    if (dirtyRef.current || state.isDragging) {
      animRef.current = requestAnimationFrame(render)
    }
  }, [])

  const startLoop = useCallback(() => {
    dirtyRef.current = true
    cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(render)
  }, [render])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
    })
    if (!gl) {
      console.warn('WebGL2 not available, falling back to canvas-only rendering')
      return
    }
    glRef.current = gl

    const quadVerts = new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1,
    ])
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW)

    const mainProg = createProgram(gl, vertSrc, glassFragSrc)
    progRef.current = mainProg
    gl.useProgram(mainProg)

    const posLoc = gl.getAttribLocation(mainProg, 'a_position')
    const tcLoc = gl.getAttribLocation(mainProg, 'a_texCoord')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(tcLoc)
    gl.vertexAttribPointer(tcLoc, 2, gl.FLOAT, false, 16, 8)

    const bh = createProgram(gl, blurVertex, blurHorizontal)
    blurHProgRef.current = bh
    gl.useProgram(bh)
    const bhpL = gl.getAttribLocation(bh, 'a_position')
    const bhtL = gl.getAttribLocation(bh, 'a_texCoord')
    gl.enableVertexAttribArray(bhpL)
    gl.vertexAttribPointer(bhpL, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(bhtL)
    gl.vertexAttribPointer(bhtL, 2, gl.FLOAT, false, 16, 8)

    const bv = createProgram(gl, blurVertex, blurVertical)
    blurVProgRef.current = bv
    gl.useProgram(bv)
    const bvpL = gl.getAttribLocation(bv, 'a_position')
    const bvtL = gl.getAttribLocation(bv, 'a_texCoord')
    gl.enableVertexAttribArray(bvpL)
    gl.vertexAttribPointer(bvpL, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(bvtL)
    gl.vertexAttribPointer(bvtL, 2, gl.FLOAT, false, 16, 8)

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      const w = Math.round(rect.width * dpr)
      const h = Math.round(rect.height * dpr)
      canvas.width = w
      canvas.height = h
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      sizeRef.current = { w, h }

      fbo1Ref.current = createFbo(gl, w, h)
      fbo2Ref.current = createFbo(gl, w, h)
    }
    resize()
    window.addEventListener('resize', resize)

    const unsub = useGlassStore.subscribe(() => {
      if (!dirtyRef.current) {
        dirtyRef.current = true
        cancelAnimationFrame(animRef.current)
        animRef.current = requestAnimationFrame(render)
      }
    })

    function loadBg(bgId: string) {
      const gl2 = glRef.current
      if (!gl2) return
      if (isBackgroundId(bgId)) {
        const canvas = makeBackgroundCanvas(bgId)
        bgSizeRef.current = { w: canvas.width, h: canvas.height }
        bgTexRef.current = uploadCanvasAsTexture(gl2, canvas)
        startLoop()
      } else if (bgId.startsWith('data:')) {
        const img = new Image()
        img.onload = () => {
          bgSizeRef.current = { w: img.naturalWidth, h: img.naturalHeight }
          bgTexRef.current = uploadImageAsTexture(gl2, img)
          startLoop()
        }
        img.src = bgId
      }
    }

    loadBg(useGlassStore.getState().background)

    const unsubBg = useGlassStore.subscribe((state, prev) => {
      if (state.background !== prev.background) {
        loadBg(state.background)
      }
    })

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      unsub()
      unsubBg()
    }
  }, [render, startLoop])

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  )
}
