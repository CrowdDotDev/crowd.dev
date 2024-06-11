import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { Unleash } from '@crowd/feature-flags'
import { Client as TemporalClient } from '@crowd/temporal'
import { SegmentData } from '@crowd/types'
import { DbConnection } from '@crowd/data-access-layer/src/database'

export interface IRepositoryOptions {
  log: Logger
  redis: RedisClient
  language: string
  currentUser: any
  currentTenant: any
  currentSegments: SegmentData[]
  database: any
  qdb?: DbConnection
  transaction?: any
  bypassPermissionValidation?: any
  opensearch?: any
  unleash?: Unleash
  temporal: TemporalClient
  productDb: DbConnection
}
