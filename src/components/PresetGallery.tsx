import { PRESETS } from '../lib/presets'
import type { GlassParams } from '../store/glassStore'

interface PresetGalleryProps {
  onApply: (params: GlassParams) => void
}

const PRESET_COLORS: Record<string, string> = {
  Subtle: 'from-white/10 to-white/5',
  Frosted: 'from-blue-500/15 to-white/5',
  'Crystal Clear': 'from-cyan-400/15 to-white/10',
  'Tinted Blue': 'from-blue-600/20 to-blue-400/10',
  'Control Center': 'from-zinc-800/30 to-zinc-900/20',
}

export default function PresetGallery({ onApply }: PresetGalleryProps) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-[0.06em] text-text-secondary mb-2">
        Presets
      </span>
      <div className="grid grid-cols-5 gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => onApply(p.params)}
            className="flex flex-col items-center gap-1 px-1 py-2 rounded-lg bg-white/5 border border-glass-border hover:bg-white/10 transition-all duration-150 cursor-pointer group"
            title={p.name}
          >
            <div
              className={`w-full h-6 rounded-md bg-gradient-to-br ${PRESET_COLORS[p.name] ?? 'from-white/10 to-white/5'} border border-white/10`}
            />
            <span className="text-[9px] uppercase tracking-[0.04em] text-text-secondary group-hover:text-text-primary transition-colors">
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
