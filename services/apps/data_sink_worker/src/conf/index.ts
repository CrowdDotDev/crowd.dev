import config from 'config'

import { SERVICE } from '@crowd/common'
import { IDatabaseConfig } from '@crowd/data-access-layer/src/database'
import { IUnleashConfig } from '@crowd/feature-flags'
import { ISearchSyncApiConfig } from '@crowd/opensearch'
import { IQueueClientConfig } from '@crowd/queue'
import { IRedisConfiguration } from '@crowd/redis'
import { ISentimentClientConfig } from '@crowd/sentiment'
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

let sentimentConfigInitialized = false
let sentimentConfig: ISentimentClientConfig | undefined
export const SENTIMENT_CONFIG = (): ISentimentClientConfig | undefined => {
  if (sentimentConfigInitialized) return sentimentConfig

  sentimentConfigInitialized = true
  if (config.has('sentiment')) {
    sentimentConfig = config.get<ISentimentClientConfig>('sentiment')
  }

  return sentimentConfig
}

let unleashConfig: IUnleashConfig | undefined
export const UNLEASH_CONFIG = (): IUnleashConfig | undefined => {
  if (unleashConfig) return unleashConfig

  unleashConfig = Object.assign({ appName: SERVICE }, config.get<IUnleashConfig>('unleash'))

  return unleashConfig
}

export interface IDataSinkWorkerTemporalConfig extends ITemporalConfig {
  automationsTaskQueue: string
}

let temporalConfig: IDataSinkWorkerTemporalConfig | undefined
export const TEMPORAL_CONFIG = (): IDataSinkWorkerTemporalConfig | undefined => {
  if (temporalConfig) return temporalConfig

  temporalConfig = config.get<IDataSinkWorkerTemporalConfig>('temporal')

  return temporalConfig
}

export const SEARCH_SYNC_API_CONFIG = (): ISearchSyncApiConfig => {
  return config.get<ISearchSyncApiConfig>('searchSyncApi')
}
