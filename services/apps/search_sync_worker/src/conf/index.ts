import { IDatabaseConfig } from '@crowd/data-access-layer/src/database'
import { IQueueEnvironment } from '@crowd/queue'
import { IRedisConfiguration } from '@crowd/redis'
import { QueuePriorityLevel } from '@crowd/types'
import config from 'config'

export interface IOpenSearchConfig {
  node: string
  username: string
  password: string
}

export interface IServiceConfig {
  queuePriorityLevel: QueuePriorityLevel
}

let serviceConfig: IServiceConfig
export const SERVICE_CONFIG = (): IServiceConfig => {
  if (serviceConfig) return serviceConfig

  serviceConfig = config.get<IServiceConfig>('service')
  return serviceConfig
}

let openSearchConfig: IOpenSearchConfig
export const OPENSEARCH_CONFIG = (): IOpenSearchConfig => {
  if (openSearchConfig) return openSearchConfig

  openSearchConfig = config.get<IOpenSearchConfig>('opensearch')
  return openSearchConfig
}

let queueConfig: IQueueEnvironment
export const QUEUE_CONFIG = (): IQueueEnvironment => {
  if (queueConfig) return queueConfig

  queueConfig = config.get<IQueueEnvironment>('queue')
  return queueConfig
}

let dbConfig: IDatabaseConfig
export const DB_CONFIG = (): IDatabaseConfig => {
  if (dbConfig) return dbConfig

  dbConfig = config.get<IDatabaseConfig>('db')
  return dbConfig
}

let redisConfig: IRedisConfiguration
export const REDIS_CONFIG = (): IRedisConfiguration => {
  if (redisConfig) return redisConfig

  redisConfig = config.get<IRedisConfiguration>('redis')
  return redisConfig
}
