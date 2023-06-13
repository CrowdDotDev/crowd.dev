import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'

export interface IServiceOptions {
  log: Logger
  language: string
  currentUser: any
  currentTenant: any
  database: any
  redis: RedisClient
}
