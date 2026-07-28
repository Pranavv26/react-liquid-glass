import type { Elasticity } from '../store/glassStore'

export interface SpringConfig {
  stiffness: number
  damping: number
  mass: number
}

export function getSpringConfig(elasticity: Elasticity): SpringConfig {
  switch (elasticity) {
    case 'low':
      return { stiffness: 500, damping: 50, mass: 1 }
    case 'high':
      return { stiffness: 180, damping: 20, mass: 1 }
    case 'medium':
    default:
      return { stiffness: 300, damping: 30, mass: 1 }
  }
}
