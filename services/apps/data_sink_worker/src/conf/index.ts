import config from 'config'

import { IDatabaseConfig } from '@crowd/data-access-layer/src/database'
import { ISearchSyncApiConfig } from '@crowd/opensearch'
import { IQueueClientConfig } from '@crowd/queue'
import { IRedisConfiguration } from '@crowd/redis'
import { ITemporalConfig } from '@crowd/temporal'
import { QueuePriorityLevel } from '@crowd/types'

export interface ISlackAlertingConfig {
  url: string
}

export interface IWorkerConfig {
  maxStreamRetries: number
  queuePriorityLevel: QueuePriorityLevel
}

let workerSettings: IWorkerConfig
export const WORKER_SETTINGS = (): IWorkerConfig => {
  if (workerSettings) return workerSettings

  workerSettings = config.get<IWorkerConfig>('worker')
  return workerSettings
}

let redisConfig: IRedisConfiguration
export const REDIS_CONFIG = (): IRedisConfiguration => {
  if (redisConfig) return redisConfig

  redisConfig = config.get<IRedisConfiguration>('redis')
  return redisConfig
}

let queueConfig: IQueueClientConfig
export const QUEUE_CONFIG = (): IQueueClientConfig => {
  if (queueConfig) return queueConfig

  queueConfig = config.get<IQueueClientConfig>('queue')
  return queueConfig
}

let dbConfig: IDatabaseConfig
export const DB_CONFIG = (): IDatabaseConfig => {
  if (dbConfig) return dbConfig

  dbConfig = config.get<IDatabaseConfig>('db')
  return dbConfig
}

let slackAlertingConfig: ISlackAlertingConfig
export const SLACK_ALERTING_CONFIG = (): ISlackAlertingConfig => {
  if (slackAlertingConfig) return slackAlertingConfig

  slackAlertingConfig = config.get<ISlackAlertingConfig>('slackAlerting')
  return slackAlertingConfig
}

let temporalConfig: ITemporalConfig | undefined
export const TEMPORAL_CONFIG = (): ITemporalConfig | undefined => {
  if (temporalConfig) return temporalConfig

  temporalConfig = config.get<ITemporalConfig>('temporal')

  return temporalConfig
}

export const SEARCH_SYNC_API_CONFIG = (): ISearchSyncApiConfig => {
  return config.get<ISearchSyncApiConfig>('searchSyncApi')
}
