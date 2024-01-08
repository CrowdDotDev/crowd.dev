import CubeDimensions from 'dimensions'

export interface ICubeFilter {
  member: CubeDimensions
  operator: string
  values: string[]
}
