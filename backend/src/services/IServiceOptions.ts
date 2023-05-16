import { SegmentData } from '../types/segmentTypes'
import { Logger } from '../utils/logging'

export interface IServiceOptions {
  log: Logger
  language: string
  currentUser: any
  currentTenant: any
  currentSegments: SegmentData[]
  database: any
  searchEngine: any
}
