import type { GlassParams } from '../store/glassStore'

export interface Preset {
  name: string
  params: GlassParams
}

export const PRESETS: Preset[] = [
  {
    name: 'Subtle',
    params: {
      blur: 8,
      saturation: 1.15,
      refractionStrength: 15,
      rimWidth: 10,
      tintColor: '#ffffff',
      tintOpacity: 0,
      chromaticAberration: 0,
      specularIntensity: 30,
      cornerRadius: 20,
    },
  },
  {
    name: 'Frosted',
    params: {
      blur: 20,
      saturation: 1.3,
      refractionStrength: 35,
      rimWidth: 18,
      tintColor: '#ffffff',
      tintOpacity: 0.08,
      chromaticAberration: 5,
      specularIntensity: 50,
      cornerRadius: 24,
    },
  },
  {
    name: 'Crystal Clear',
    params: {
      blur: 2,
      saturation: 1.05,
      refractionStrength: 60,
      rimWidth: 22,
      tintColor: '#ffffff',
      tintOpacity: 0,
      chromaticAberration: 15,
      specularIntensity: 70,
      cornerRadius: 16,
    },
  },
  {
    name: 'Tinted Blue',
    params: {
      blur: 14,
      saturation: 1.2,
      refractionStrength: 40,
      rimWidth: 16,
      tintColor: '#4A90E2',
      tintOpacity: 0.18,
      chromaticAberration: 8,
      specularIntensity: 55,
      cornerRadius: 28,
    },
  },
  {
    name: 'Control Center',
    params: {
      blur: 24,
      saturation: 1.4,
      refractionStrength: 45,
      rimWidth: 20,
      tintColor: '#000000',
      tintOpacity: 0.1,
      chromaticAberration: 6,
      specularIntensity: 65,
      cornerRadius: 32,
    },
  },
]
