import { Logger } from '@crowd/logging'
import { SegmentData } from '../../types/segmentTypes'

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
