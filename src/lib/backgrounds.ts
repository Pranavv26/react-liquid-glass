export type BackgroundId = 'grid' | 'diagonal' | 'checkerboard' | 'rings' | 'skyline' | 'gradient'

export interface BackgroundMeta {
  id: BackgroundId
  label: string
  description: string
}

export const BACKGROUND_LIST: BackgroundMeta[] = [
  { id: 'grid', label: 'Grid', description: 'Straight lines — refraction test' },
  { id: 'diagonal', label: 'Diagonal', description: 'Diagonal stripes — lens effect' },
  { id: 'checkerboard', label: 'Checkerboard', description: 'High-contrast squares — color test' },
  { id: 'rings', label: 'Rings', description: 'Concentric rings — curve test' },
  { id: 'skyline', label: 'Skyline', description: 'City + bokeh — specular test' },
  { id: 'gradient', label: 'Gradient Mesh (style only)', description: 'Soft gradient — aesthetic only' },
]

const CANVAS_SIZE = 2048

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(140, 170, 255, 0.35)'
  ctx.lineWidth = 1
  const spacing = 48
  for (let x = 0; x <= w; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y <= h; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h)
  ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2)
  ctx.stroke()
}

function drawDiagonalStripes(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  ctx.fillStyle = '#111827'
  ctx.fillRect(0, 0, w, h)
  ctx.translate(w / 2, h / 2)
  ctx.rotate(Math.PI / 4)
  ctx.translate(-w, -h)
  const stripe = 40
  for (let x = 0; x < w * 3; x += stripe * 2) {
    ctx.fillStyle = '#f72585'
    ctx.fillRect(x, 0, stripe, h * 3)
  }
  ctx.restore()
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 0.5
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.arc(Math.random() * w, Math.random() * h, 20 + Math.random() * 40, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const size = 64
  const a = '#ff5f6d', b = '#1fc8a9'
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      ctx.fillStyle = ((x / size) + (y / size)) % 2 === 0 ? a : b
      ctx.fillRect(x, y, size, size)
    }
  }
}

function drawConcentricRings(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2
  const maxR = Math.hypot(cx, cy)
  const ringWidth = 36
  const colors = ['#ffb703', '#fb8500', '#023047', '#219ebc', '#8ecae6']
  for (let r = Math.ceil(maxR / ringWidth) * ringWidth; r > 0; r -= ringWidth) {
    ctx.fillStyle = colors[Math.floor(r / ringWidth) % colors.length]
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawSkylineBokeh(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#0b1026')
  sky.addColorStop(1, '#1b2a4a')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#050814'
  let x = 0
  while (x < w) {
    const bw = 40 + Math.random() * 60
    const bh = 100 + Math.random() * (h * 0.5)
    ctx.fillRect(x, h - bh, bw, bh)
    x += bw + 4
  }

  for (let i = 0; i < 40; i++) {
    const bx = Math.random() * w
    const by = Math.random() * h * 0.7
    const r = 6 + Math.random() * 18
    const glow = ctx.createRadialGradient(bx, by, 0, bx, by, r)
    glow.addColorStop(0, 'rgba(255, 214, 140, 0.9)')
    glow.addColorStop(1, 'rgba(255, 214, 140, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(bx, by, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawGradient(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.7)
  g.addColorStop(0, '#ff6b35')
  g.addColorStop(0.3, '#ff2d68')
  g.addColorStop(0.6, '#8c43ff')
  g.addColorStop(1, '#00c9ff')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

const DRAW_FUNCTIONS: Record<BackgroundId, (ctx: CanvasRenderingContext2D, w: number, h: number) => void> = {
  grid: drawGrid,
  diagonal: drawDiagonalStripes,
  checkerboard: drawCheckerboard,
  rings: drawConcentricRings,
  skyline: drawSkylineBokeh,
  gradient: drawGradient,
}

export function isBackgroundId(value: string): value is BackgroundId {
  return value in DRAW_FUNCTIONS
}

export function makeBackgroundCanvas(bgId: BackgroundId, size = CANVAS_SIZE): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  DRAW_FUNCTIONS[bgId](ctx, size, size)
  return canvas
}

export function generateThumbnailCanvas(bgId: BackgroundId, size = 96): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  DRAW_FUNCTIONS[bgId](ctx, size, size)
  return canvas
}
