import { useCallback, useState, useRef, useEffect } from 'react'

const SWATCHES = [
  '#ffffff',
  '#000000',
  '#4A90E2',
  '#E24A4A',
  '#4AE2A0',
  '#E2C94A',
  '#B04AE2',
  '#E2864A',
  '#4AE2E2',
]

interface ColorSwatchPickerProps {
  color: string
  opacity: number
  onColorChange: (color: string) => void
  onOpacityChange?: (opacity: number) => void
}

export default function ColorSwatchPicker({
  color,
  onColorChange,
}: ColorSwatchPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customColor, setCustomColor] = useState(color)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSwatchClick = useCallback(
    (c: string) => {
      onColorChange(c)
      setCustomColor(c)
      setIsOpen(false)
    },
    [onColorChange],
  )

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const c = e.target.value
      setCustomColor(c)
      onColorChange(c)
    },
    [onColorChange],
  )

  return (
    <div ref={pickerRef} className="relative">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.06em] text-text-secondary">
          Tint Color
        </span>
      </div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-glass-border hover:bg-white/10 transition-colors duration-150 cursor-pointer"
      >
        <div
          className="w-5 h-5 rounded-md border border-white/20 shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-mono text-text-secondary">{color}</span>
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 p-3 rounded-xl bg-[#0a0a0c] border border-glass-border shadow-xl fade-in">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleSwatchClick(c)}
                className={`w-7 h-7 rounded-lg border-2 transition-transform duration-100 hover:scale-110 cursor-pointer ${
                  c === color ? 'border-white/60' : 'border-white/10'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
              Custom
            </span>
            <input
              type="color"
              value={customColor}
              onChange={handleCustomChange}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
          </div>
        </div>
      )}
    </div>
  )
}
