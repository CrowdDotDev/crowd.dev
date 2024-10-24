import { DbConnection } from '@crowd/data-access-layer/src/database'
import { Unleash } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { Client as TemporalClient } from '@crowd/temporal'
import { SegmentData } from '@crowd/types'

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
