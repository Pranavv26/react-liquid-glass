import { useEffect, useRef, useState, useCallback } from 'react'
import { useGlassStore } from '../store/glassStore'
import { luminance, isLight } from '../lib/luminance'
import { makeBackgroundCanvas, isBackgroundId } from '../lib/backgrounds'
import type { ShapeType } from '../store/glassStore'

function getClipPath(shapeType: ShapeType, w: number, h: number, cr: number): string {
  switch (shapeType) {
    case 'circle': {
      const r = Math.min(w, h) / 2
      return `circle(${r}px at 50% 50%)`
    }
    case 'pill': {
      const r = Math.min(w, h) / 2
      return `inset(0 round ${r}px)`
    }
    default:
      return `inset(0 round ${cr}px)`
  }
}

export default function TextOverlay() {
  const text = useGlassStore((s) => s.text)
  const position = useGlassStore((s) => s.position)
  const size = useGlassStore((s) => s.size)
  const background = useGlassStore((s) => s.background)
  const shapeType = useGlassStore((s) => s.shapeType)
  const cornerRadius = useGlassStore((s) => s.params.cornerRadius)
  const [textColor, setTextColor] = useState('#ffffff')
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const clipPath = getClipPath(shapeType, size.width, size.height, cornerRadius)

  const sampleLuminance = useCallback(() => {
    const bgCanvas = bgCanvasRef.current
    if (!bgCanvas) return
    const ctx = bgCanvas.getContext('2d')
    if (!ctx) return

    const cx = position.x + size.width / 2
    const cy = position.y + size.height / 2
    const sx = (cx / window.innerWidth) * bgCanvas.width
    const sy = (cy / window.innerHeight) * bgCanvas.height

    const px = Math.min(Math.max(0, Math.round(sx)), bgCanvas.width - 1)
    const py = Math.min(Math.max(0, Math.round(sy)), bgCanvas.height - 1)
    const data = ctx.getImageData(px, py, 1, 1).data
    const r = data[0] / 255
    const g = data[1] / 255
    const b = data[2] / 255
    const lum = luminance(r, g, b)
    setTextColor(isLight(lum) ? '#0a0a0c' : '#ffffff')
  }, [position, size])

  useEffect(() => {
    if (isBackgroundId(background)) {
      const canvas = makeBackgroundCanvas(background, 256)
      bgCanvasRef.current = canvas
      sampleLuminance()
    } else if (background.startsWith('data:')) {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, 256, 256)
        bgCanvasRef.current = canvas
        sampleLuminance()
      }
      img.src = background
    }
  }, [background, sampleLuminance])

  useEffect(() => {
    if (bgCanvasRef.current) sampleLuminance()
  }, [sampleLuminance, position.x, position.y])

  useEffect(() => {
    const interval = setInterval(() => {
      if (bgCanvasRef.current) sampleLuminance()
    }, 200)
    return () => clearInterval(interval)
  }, [sampleLuminance])

  if (!text) return null

  return (
    <div
      className="w-full h-full flex items-center justify-center pointer-events-none select-none overflow-hidden"
      style={{ clipPath }}
    >
      <span
        className="text-center font-sans font-medium truncate px-4"
        style={{
          color: textColor,
          fontSize: 'clamp(12px, 1.2vw, 18px)',
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
          textShadow: textColor === '#ffffff'
            ? '0 1px 4px rgba(0,0,0,0.3)'
            : '0 1px 2px rgba(255,255,255,0.2)',
          transition: 'color 0.2s ease',
        }}
      >
        {text}
      </span>
    </div>
  )
}
