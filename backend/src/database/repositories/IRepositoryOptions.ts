import { SegmentData } from '../../types/segmentTypes'
import { Logger } from '@crowd/logging'

export interface IRepositoryOptions {
  log: Logger
  language: string
  currentUser: any
  currentTenant: any
  currentSegments: SegmentData[]
  database: any
  transaction?: any
  bypassPermissionValidation?: any
}
