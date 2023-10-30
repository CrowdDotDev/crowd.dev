import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { Unleash } from '@crowd/feature-flags'
import { Client as TemporalClient } from '@crowd/temporal'
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
  unleash?: Unleash
  temporal: TemporalClient
}
