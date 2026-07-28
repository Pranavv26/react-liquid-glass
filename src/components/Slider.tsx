import { useCallback, useRef, type PointerEvent } from 'react'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  ariaLabel?: string
}

export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  ariaLabel,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const pct = ((value - min) / (max - min)) * 100

  const valueFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return value
      const rect = track.getBoundingClientRect()
      const raw = ((clientX - rect.left) / rect.width) * (max - min) + min
      return clamp(Math.round(raw / step) * step)
    },
    [min, max, step, value],
  )

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      isDragging.current = true
      const el = trackRef.current
      if (el) el.setPointerCapture(e.pointerId)
      onChange(valueFromPointer(e.clientX))
    },
    [onChange, valueFromPointer],
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging.current) return
      onChange(valueFromPointer(e.clientX))
    },
    [onChange, valueFromPointer],
  )

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newVal = value
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        newVal = clamp(value + step)
        e.preventDefault()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        newVal = clamp(value - step)
        e.preventDefault()
      } else if (e.key === 'Home') {
        newVal = min
        e.preventDefault()
      } else if (e.key === 'End') {
        newVal = max
        e.preventDefault()
      }
      if (newVal !== value) onChange(newVal)
    },
    [value, step, min, max, onChange],
  )

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] uppercase tracking-[0.06em] text-text-secondary">
          {label}
        </label>
        <span className="text-[12px] font-medium tabular-nums text-text-primary">
          {value}{unit}
        </span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel ?? label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}${unit}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative h-5 flex items-center cursor-pointer outline-none group"
      >
        <div className="absolute inset-x-0 h-[3px] rounded-full bg-slider-track" />
        <div
          className="absolute left-0 h-[3px] rounded-full bg-slider-fill transition-[width] duration-75"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute w-[14px] h-[14px] rounded-full bg-slider-thumb shadow-md transition-transform duration-100 group-hover:scale-110 group-active:scale-90"
          style={{ left: `calc(${pct}% - 7px)` }}
        />
      </div>
    </div>
  )
}
