import { CubeDimension, CubeOrderDirection, CubeMeasure } from './enums'

export interface ICubeFilter {
  member: CubeDimension
  operator: string
  values: string[]
}

export interface IDashboardFilter {
  platform?: string
  segments?: string[]
}

type CubeOrderKey = CubeDimension | CubeMeasure

export type ICubeOrder = { [key in CubeOrderKey]?: CubeOrderDirection | string }
