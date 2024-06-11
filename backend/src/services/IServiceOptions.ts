import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { SegmentData } from '@crowd/types'
import { Unleash } from '@crowd/feature-flags'
import { Client as TemporalClient } from '@crowd/temporal'
import { DbConnection } from '@crowd/data-access-layer/src/database'

export interface IServiceOptions {
  log: Logger
  language: string
  currentUser: any
  currentTenant: any
  currentSegments: SegmentData[]
  database: any
  qdb?: DbConnection
  redis: RedisClient
  transaction?: any
  unleash?: Unleash
  temporal: TemporalClient
  productDb: DbConnection
  profileSql?: boolean
}
