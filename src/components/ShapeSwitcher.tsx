import type { ShapeType } from '../store/glassStore'

const SHAPES: { key: ShapeType; label: string }[] = [
  { key: 'roundedRect', label: 'Squircle' },
  { key: 'circle', label: 'Circle' },
  { key: 'pill', label: 'Pill' },
]

interface ShapeSwitcherProps {
  value: ShapeType
  onChange: (type: ShapeType) => void
}

export default function ShapeSwitcher({ value, onChange }: ShapeSwitcherProps) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-[0.06em] text-text-secondary mb-2">
        Shape
      </span>
      <div className="flex gap-1.5">
        {SHAPES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.key)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 cursor-pointer ${
              s.key === value
                ? 'bg-white/12 border-white/25 text-white'
                : 'bg-white/5 border-glass-border text-text-secondary hover:bg-white/10'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
