export type ShapeType = 'roundedRect' | 'circle' | 'pill'

export function getShapeTypeIndex(type: ShapeType): number {
  switch (type) {
    case 'circle': return 1
    case 'pill': return 2
    default: return 0
  }
}
