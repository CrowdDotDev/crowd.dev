import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { SegmentData } from '../../types/segmentTypes'

export interface IRepositoryOptions {
  log: Logger
  redis: RedisClient
  language: string
  currentUser: any
  currentTenant: any
  currentSegments: SegmentData[]
  database: any
  transaction?: any
  bypassPermissionValidation?: any
}
