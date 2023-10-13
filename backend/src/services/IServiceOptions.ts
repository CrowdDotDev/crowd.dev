import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { SegmentData } from '../types/segmentTypes'

export interface IServiceOptions {
  log: Logger
  language: string
  currentUser: any
  currentTenant: any
  currentSegments: SegmentData[]
  database: any
  redis: RedisClient
  transaction?: any
}
