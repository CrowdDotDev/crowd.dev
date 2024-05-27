import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { SegmentData } from '@crowd/types'
import { Unleash } from '@crowd/feature-flags'
import { Client as TemporalClient } from '@crowd/temporal'

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
