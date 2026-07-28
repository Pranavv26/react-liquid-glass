import { useCallback, useEffect, useRef, useState } from 'react'
import { useGlassStore } from '../store/glassStore'
import { BACKGROUND_LIST, generateThumbnailCanvas } from '../lib/backgrounds'
import type { BackgroundId } from '../lib/backgrounds'

function Thumbnail({ bgId, selected }: { bgId: BackgroundId; selected: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const thumb = generateThumbnailCanvas(bgId, 96)
    const ctx = canvas.getContext('2d')!
    canvas.width = 96
    canvas.height = 72
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(thumb, 0, 0, 96, 72)
  }, [bgId])
  return (
    <canvas
      ref={ref}
      className={`w-full h-full rounded-lg object-cover ${
        selected ? 'ring-2 ring-white/40' : ''
      }`}
    />
  )
}

export default function BackgroundPicker() {
  const background = useGlassStore((s) => s.background)
  const setBackground = useGlassStore((s) => s.setBackground)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setUploading(true)
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setBackground(reader.result)
        }
        setUploading(false)
      }
      reader.onerror = () => setUploading(false)
      reader.readAsDataURL(file)
    },
    [setBackground],
  )

  return (
    <div>
      <span className="block text-[11px] uppercase tracking-[0.06em] text-text-secondary mb-2">
        Background
      </span>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {BACKGROUND_LIST.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBackground(b.id)}
            className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all duration-150 cursor-pointer ${
              background === b.id
                ? 'border-white/50 ring-1 ring-white/20'
                : 'border-glass-border hover:border-white/20'
            }`}
            title={b.description}
          >
            <Thumbnail bgId={b.id} selected={background === b.id} />
            <span className="absolute bottom-0.5 left-0.5 text-[7px] font-medium text-white/70 bg-black/40 px-1 rounded truncate max-w-[90%]">
              {b.label}
            </span>
          </button>
        ))}
      </div>
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-glass-border bg-white/5 text-text-secondary hover:bg-white/10 transition-colors duration-150 cursor-pointer disabled:opacity-50"
        >
          {uploading ? 'Loading...' : 'Upload Image'}
        </button>
      </div>
    </div>
  )
}
