import { SegmentData } from '../../types/segmentTypes'
import { Logger } from '../../utils/logging'

export interface IRepositoryOptions {
  log: Logger
  language: string
  currentUser: any
  currentTenant: any
  currentSegments: SegmentData[]
  database: any
  searchEngine: any
  transaction?: any
  bypassPermissionValidation?: any
}
