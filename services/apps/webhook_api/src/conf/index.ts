import { IDatabaseConfig } from '@crowd/data-access-layer/src/database'
import config from 'config'
import { IUnleashConfig } from '@crowd/feature-flags'
import { SERVICE } from '@crowd/common'
import { IRedisConfiguration } from '@crowd/redis'
import { IQueueEnvironment } from '../../../../libs/queue/src'
export interface IWebhookApiServiceConfig {
  port: number
}

let webhookApiConfig: IWebhookApiServiceConfig
export const WEBHOOK_API_CONFIG = (): IWebhookApiServiceConfig => {
  if (webhookApiConfig) return webhookApiConfig

  webhookApiConfig = config.get<IWebhookApiServiceConfig>('service')
  return webhookApiConfig
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

let unleashConfig: IUnleashConfig | undefined
export const UNLEASH_CONFIG = (): IUnleashConfig | undefined => {
  if (unleashConfig) return unleashConfig

  unleashConfig = Object.assign({ appName: SERVICE }, config.get<IUnleashConfig>('unleash'))

  return unleashConfig
}

let redisConfig: IRedisConfiguration
export const REDIS_CONFIG = (): IRedisConfiguration => {
  if (redisConfig) return redisConfig

  redisConfig = config.get<IRedisConfiguration>('redis')
  return redisConfig
}
