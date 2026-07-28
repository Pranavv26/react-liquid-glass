import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGlassStore } from '../store/glassStore'
import type { GlassParams, Elasticity } from '../store/glassStore'

import Slider from './Slider'
import ColorSwatchPicker from './ColorSwatchPicker'
import ShapeSwitcher from './ShapeSwitcher'
import BackgroundPicker from './BackgroundPicker'
import PresetGallery from './PresetGallery'

function useMediaQuery(q: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mql = window.matchMedia(q)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [q])
  return matches
}

const ELASTICITY_OPTIONS: { key: Elasticity; label: string }[] = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Med' },
  { key: 'high', label: 'High' },
]

export default function ControlPanel() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isOpen, setIsOpen] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const params = useGlassStore((s) => s.params)
  const shapeType = useGlassStore((s) => s.shapeType)
  const elasticity = useGlassStore((s) => s.elasticity)
  const text = useGlassStore((s) => s.text)
  const setParam = useGlassStore((s) => s.setParam)
  const setParams = useGlassStore((s) => s.setParams)
  const setShapeType = useGlassStore((s) => s.setShapeType)
  const setElasticity = useGlassStore((s) => s.setElasticity)
  const setText = useGlassStore((s) => s.setText)
  const debugShowDisplacement = useGlassStore((s) => s.debugShowDisplacement)
  const setDebugShowDisplacement = useGlassStore((s) => s.setDebugShowDisplacement)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }, [])

  const handleApplyPreset = useCallback(
    (p: GlassParams) => {
      setParams(p)
      showToast(`Preset applied`)
    },
    [setParams, showToast],
  )

  const handleExport = useCallback(
    (format: 'json' | 'css') => {
      let output = ''
      if (format === 'json') {
        output = JSON.stringify({ shapeType, elasticity, text, params }, null, 2)
      } else {
        output = `/* Liquid Glass CSS */
.glass-element {
  border-radius: ${params.cornerRadius}px;
  backdrop-filter: blur(${params.blur}px) saturate(${(params.saturation * 100).toFixed(0)}%) brightness(1.05);
  -webkit-backdrop-filter: blur(${params.blur}px) saturate(${(params.saturation * 100).toFixed(0)}%) brightness(1.05);
  background: color-mix(in srgb, transparent, ${params.tintColor} ${(params.tintOpacity * 100).toFixed(0)}%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}`
      }
      navigator.clipboard.writeText(output).then(
        () => showToast(`Copied as ${format.toUpperCase()}`),
        () => showToast('Failed to copy'),
      )
    },
    [params, shapeType, elasticity, text, showToast],
  )

  return (
    <>
      {isMobile && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full glass-panel text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          Open Controls
        </button>
      )}
      <AnimatePresence>
        {(!isMobile || isOpen) && (
          <motion.div
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={`${
              isMobile
                ? 'fixed bottom-0 left-0 right-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-2xl pb-2'
                : 'fixed top-4 right-4 bottom-4 z-40 w-[320px] overflow-y-auto'
            } glass-panel shadow-2xl`}
          >
            {isMobile && (
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-3 pb-2 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-glass-divider">
                <span className="text-[11px] uppercase tracking-[0.06em] text-text-secondary">
                  Controls
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            <div className="p-5 space-y-5">
              <PresetGallery onApply={handleApplyPreset} />

              <div className="h-px bg-glass-divider" />

              <BackgroundPicker />

              <div className="h-px bg-glass-divider" />

              <ShapeSwitcher value={shapeType} onChange={setShapeType} />

              <div className="h-px bg-glass-divider" />

              <div className="space-y-3">
                <Slider
                  label="Blur"
                  value={params.blur}
                  min={0}
                  max={40}
                  step={1}
                  unit="px"
                  onChange={(v) => setParam('blur', v)}
                />
                <Slider
                  label="Saturation"
                  value={Math.round(params.saturation * 100)}
                  min={50}
                  max={200}
                  step={5}
                  unit="%"
                  onChange={(v) => setParam('saturation', v / 100)}
                />
                <Slider
                  label="Refraction"
                  value={params.refractionStrength}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => setParam('refractionStrength', v)}
                />
                <Slider
                  label="Rim Width"
                  value={params.rimWidth}
                  min={4}
                  max={40}
                  step={1}
                  unit="px"
                  onChange={(v) => setParam('rimWidth', v)}
                />
                <Slider
                  label="Chromatic Aberration"
                  value={params.chromaticAberration}
                  min={0}
                  max={20}
                  step={1}
                  onChange={(v) => setParam('chromaticAberration', v)}
                />
                <Slider
                  label="Specular Intensity"
                  value={params.specularIntensity}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => setParam('specularIntensity', v)}
                />
                <Slider
                  label="Corner Radius"
                  value={params.cornerRadius}
                  min={0}
                  max={50}
                  step={1}
                  unit="px"
                  onChange={(v) => setParam('cornerRadius', v)}
                />
                <Slider
                  label="Tint Opacity"
                  value={Math.round(params.tintOpacity * 100)}
                  min={0}
                  max={40}
                  step={1}
                  unit="%"
                  onChange={(v) => setParam('tintOpacity', v / 100)}
                />
              </div>

              <ColorSwatchPicker
                color={params.tintColor}
                opacity={params.tintOpacity}
                onColorChange={(c) => setParam('tintColor', c)}
              />

              <div className="h-px bg-glass-divider" />

              <div>
                <span className="block text-[11px] uppercase tracking-[0.06em] text-text-secondary mb-2">
                  Elasticity
                </span>
                <div className="flex gap-1.5">
                  {ELASTICITY_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => setElasticity(o.key)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 cursor-pointer ${
                        o.key === elasticity
                          ? 'bg-white/12 border-white/25 text-white'
                          : 'bg-white/5 border-glass-border text-text-secondary hover:bg-white/10'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-glass-divider" />

              <div>
                <span className="block text-[11px] uppercase tracking-[0.06em] text-text-secondary mb-2">
                  Text
                </span>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={30}
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-glass-border rounded-lg text-text-primary placeholder-text-tertiary outline-none focus:border-white/30 transition-colors"
                  placeholder="Type something..."
                />
              </div>

              <div className="h-px bg-glass-divider" />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-glass-border bg-white/5 text-text-secondary hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Copy JSON
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('css')}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-glass-border bg-white/5 text-text-secondary hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Copy CSS
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                  Debug
                </span>
                <button
                  type="button"
                  onClick={() => setDebugShowDisplacement(!debugShowDisplacement)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-colors cursor-pointer ${
                    debugShowDisplacement
                      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                      : 'bg-white/5 border-glass-border text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {debugShowDisplacement ? 'Displacement: ON' : 'Show Displacement'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 glass-panel-light text-xs font-medium text-text-primary shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
