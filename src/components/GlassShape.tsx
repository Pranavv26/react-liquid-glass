import { useRef, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useGlassStore } from '../store/glassStore'
import { getSpringConfig } from '../lib/springConfig'

const CLAMP_MARGIN = 0.4
const SYNC_EPSILON = 0.01

export default function GlassShape({ children }: { children?: ReactNode }) {
  const position = useGlassStore((s) => s.position)
  const size = useGlassStore((s) => s.size)
  const elasticity = useGlassStore((s) => s.elasticity)
  const setPosition = useGlassStore((s) => s.setPosition)
  const setIsDragging = useGlassStore((s) => s.setIsDragging)
  const setHighlightBoost = useGlassStore((s) => s.setHighlightBoost)

  const shapeRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const containerRect = useRef({ width: 0, height: 0 })
  const springConfig = getSpringConfig(elasticity)

  const rawX = useMotionValue(position.x)
  const rawY = useMotionValue(position.y)
  const springX = useSpring(rawX, { ...springConfig })
  const springY = useSpring(rawY, { ...springConfig })
  const isDraggingRef = useRef(false)

  // Tracks the last {x, y} WE pushed into the store from the spring's own
  // onChange (below). This lets the effect underneath tell the difference
  // between "the store changed because our own spring animated a tick"
  // (must NOT be fed back in as a new target) and "the store changed
  // because something else moved the shape" e.g. a reset/center button or
  // a numeric position field elsewhere in the app (SHOULD be synced in).
  //
  // Previously every spring tick was echoed straight back into rawX/rawY
  // as a fresh target, which told the spring "you've already arrived"
  // before it had actually finished easing — clipping the animation short
  // every frame. That's what caused the jittery / uneven motion, most
  // visible right as you released a drag.
  const lastEmitted = useRef({ x: position.x, y: position.y })

  useEffect(() => {
    if (isDraggingRef.current) return
    const dx = Math.abs(position.x - lastEmitted.current.x)
    const dy = Math.abs(position.y - lastEmitted.current.y)
    if (dx < SYNC_EPSILON && dy < SYNC_EPSILON) return
    rawX.set(position.x)
    rawY.set(position.y)
    lastEmitted.current = { x: position.x, y: position.y }
  }, [position.x, position.y, rawX, rawY])

  useEffect(() => {
    const unsubX = springX.on('change', (v) => {
      const next = { x: v, y: springY.get() }
      lastEmitted.current = next
      setPosition(next)
    })
    const unsubY = springY.on('change', (v) => {
      const next = { x: springX.get(), y: v }
      lastEmitted.current = next
      setPosition(next)
    })
    return () => {
      unsubX()
      unsubY()
    }
  }, [springX, springY, setPosition])

  const clampPosition = useCallback(
    (nx: number, ny: number) => {
      const r = containerRect.current
      if (!r.width || !r.height) return { x: nx, y: ny }
      const minX = -size.width * (1 - CLAMP_MARGIN)
      const maxX = r.width - size.width * CLAMP_MARGIN
      const minY = -size.height * (1 - CLAMP_MARGIN)
      const maxY = r.height - size.height * CLAMP_MARGIN
      return {
        x: Math.min(maxX, Math.max(minX, nx)),
        y: Math.min(maxY, Math.max(minY, ny)),
      }
    },
    [size],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = shapeRef.current
      const container = el?.closest('[data-canvas-container]') as HTMLElement
      if (!el || !container) return
      containerRect.current = {
        width: container.clientWidth,
        height: container.clientHeight,
      }
      el.setPointerCapture(e.pointerId)

      // Use the spring's current *rendered* value, not the raw target.
      // If the shape is still mid-bounce from the previous release,
      // rawX/rawY already point at the resting position, not where the
      // shape visually is right now — grabbing it there would anchor the
      // offset to the wrong point and cause a jump on the first move.
      const cx = springX.get()
      const cy = springY.get()
      rawX.set(cx)
      rawY.set(cy)

      dragOffset.current = {
        x: e.clientX - cx,
        y: e.clientY - cy,
      }
      isDraggingRef.current = true
      setIsDragging(true)
      setHighlightBoost(1.5)
    },
    [setIsDragging, setHighlightBoost, rawX, rawY, springX, springY],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return
      const nx = e.clientX - dragOffset.current.x
      const ny = e.clientY - dragOffset.current.y
      const clamped = clampPosition(nx, ny)
      rawX.set(clamped.x)
      rawY.set(clamped.y)
    },
    [clampPosition, rawX, rawY],
  )

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false
    setIsDragging(false)
    const start = performance.now()
    const duration = 350
    function decay() {
      const elapsed = performance.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      setHighlightBoost(1.5 - 0.5 * eased)
      if (progress < 1) requestAnimationFrame(decay)
    }
    requestAnimationFrame(decay)
  }, [setIsDragging, setHighlightBoost])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 20 : 5
      let nx = rawX.get()
      let ny = rawY.get()
      if (e.key === 'ArrowLeft') { nx -= step; e.preventDefault() }
      if (e.key === 'ArrowRight') { nx += step; e.preventDefault() }
      if (e.key === 'ArrowUp') { ny -= step; e.preventDefault() }
      if (e.key === 'ArrowDown') { ny += step; e.preventDefault() }
      const clamped = clampPosition(nx, ny)
      rawX.set(clamped.x)
      rawY.set(clamped.y)
    },
    [clampPosition, rawX, rawY],
  )

  return (
    <motion.div
      ref={shapeRef}
      className="absolute top-0 left-0 z-10 cursor-grab active:cursor-grabbing outline-none rounded-lg focus-visible:ring-1 focus-visible:ring-white/30"
      style={{
        width: size.width,
        height: size.height,
        x: springX,
        y: springY,
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Glass shape. Draggable. Use arrow keys to move."
    >
      {children}
    </motion.div>
  )
}