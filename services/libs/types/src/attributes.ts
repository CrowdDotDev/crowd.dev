import { PlatformType } from './enums/platforms'

export interface IAttributes {
  [key: string]: Record<PlatformType, unknown>
}
