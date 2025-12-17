import { DbConnection } from '@crowd/data-access-layer/src/database'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { Client as TemporalClient } from '@crowd/temporal'
import { SegmentData } from '@crowd/types'

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
  opensearch?: any
  temporal: TemporalClient
  productDb: DbConnection
}
