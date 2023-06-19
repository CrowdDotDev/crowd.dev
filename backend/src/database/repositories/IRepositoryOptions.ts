import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'

export interface IRepositoryOptions {
  log: Logger
  redis: RedisClient
  language: string
  currentUser: any
  currentTenant: any
  database: any
  transaction?: any
  bypassPermissionValidation?: any
  opensearch?: any
}
