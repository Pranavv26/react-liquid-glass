import { create } from 'zustand'
import { BACKGROUND_LIST } from '../lib/backgrounds'
import type { BackgroundId } from '../lib/backgrounds'

export type ShapeType = 'roundedRect' | 'circle' | 'pill'

export interface GlassParams {
  blur: number
  saturation: number
  refractionStrength: number
  rimWidth: number
  tintColor: string
  tintOpacity: number
  chromaticAberration: number
  specularIntensity: number
  cornerRadius: number
}

export type Elasticity = 'low' | 'medium' | 'high'

export interface GlassState {
  shapeType: ShapeType
  position: { x: number; y: number }
  size: { width: number; height: number }
  params: GlassParams
  elasticity: Elasticity
  background: string
  backgroundList: BackgroundId[]
  text: string
  isDragging: boolean
  toastMessage: string | null
  highlightBoost: number
  debugShowDisplacement: boolean
  setPosition: (pos: { x: number; y: number }) => void
  setShapeType: (type: ShapeType) => void
  setParam: <K extends keyof GlassParams>(key: K, value: GlassParams[K]) => void
  setParams: (params: Partial<GlassParams>) => void
  setElasticity: (e: Elasticity) => void
  setBackground: (bg: string) => void
  setText: (text: string) => void
  setIsDragging: (d: boolean) => void
  setToastMessage: (msg: string | null) => void
  setHighlightBoost: (boost: number) => void
  setDebugShowDisplacement: (show: boolean) => void
}

const DEFAULT_PARAMS: GlassParams = {
  blur: 12,
  saturation: 1.3,
  refractionStrength: 45,
  rimWidth: 16,
  tintColor: '#ffffff',
  tintOpacity: 0,
  chromaticAberration: 4,
  specularIntensity: 60,
  cornerRadius: 28,
}

const initialX = typeof window !== 'undefined' ? window.innerWidth * 0.2 : 0
const initialY = typeof window !== 'undefined' ? window.innerHeight * 0.5 - 70 : 0

export const useGlassStore = create<GlassState>((set) => ({
  shapeType: 'roundedRect',
  position: { x: initialX, y: initialY },
  size: { width: 220, height: 140 },
  params: { ...DEFAULT_PARAMS },
  elasticity: 'medium',
  background: 'grid',
  backgroundList: BACKGROUND_LIST.map((b) => b.id),
  text: 'Liquid Glass',
  isDragging: false,
  toastMessage: null,
  highlightBoost: 1.0,
  debugShowDisplacement: false,

  setPosition: (pos) => set({ position: pos }),
  setShapeType: (shapeType) => set({ shapeType }),
  setParam: (key, value) =>
    set((state) => ({
      params: { ...state.params, [key]: value },
    })),
  setParams: (params) =>
    set((state) => ({
      params: { ...state.params, ...params },
    })),
  setElasticity: (elasticity) => set({ elasticity }),
  setBackground: (background) => set({ background }),
  setText: (text) => set({ text }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setToastMessage: (toastMessage) => set({ toastMessage }),
  setHighlightBoost: (highlightBoost) => set({ highlightBoost }),
  setDebugShowDisplacement: (debugShowDisplacement) => set({ debugShowDisplacement }),
}))
