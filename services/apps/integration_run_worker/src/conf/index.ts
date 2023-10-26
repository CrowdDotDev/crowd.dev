import { IDatabaseConfig } from '@crowd/database'
import { ISearchSyncApiConfig } from '@crowd/httpclients'
import { IRedisConfiguration } from '@crowd/redis'
import { ISqsClientConfig } from '@crowd/sqs'
import config from 'config'

export interface INangoConfig {
  url: string
  secretKey: string
}

export interface ISlackAlertingConfig {
  url: string
}

let sqsConfig: ISqsClientConfig
export const SQS_CONFIG = (): ISqsClientConfig => {
  if (sqsConfig) return sqsConfig

  sqsConfig = config.get<ISqsClientConfig>('sqs')
  return sqsConfig
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

export interface IWorkerConfig {
  maxRetries: number
}

let workerConfig: IWorkerConfig
export const WORKER_CONFIG = (): IWorkerConfig => {
  if (workerConfig) return workerConfig

  workerConfig = config.get<IWorkerConfig>('worker')
  return workerConfig
}

let nangoConfig: INangoConfig
export const NANGO_CONFIG = (): INangoConfig => {
  if (nangoConfig) return nangoConfig

  nangoConfig = config.get<INangoConfig>('nango')
  return nangoConfig
}

let slackAlertingConfig: ISlackAlertingConfig
export const SLACK_ALERTING_CONFIG = (): ISlackAlertingConfig => {
  if (slackAlertingConfig) return slackAlertingConfig

  slackAlertingConfig = config.get<ISlackAlertingConfig>('slackAlerting')
  return slackAlertingConfig
}

const platformMap: Map<string, unknown | null> = new Map()
export const PLATFORM_CONFIG = (platform: string): unknown | undefined => {
  if (platformMap.has(platform)) {
    const value = platformMap.get(platform)

    if (value === null) {
      return undefined
    }

    return value
  }

  if (config.has(platform)) {
    const value = config.get(platform)
    platformMap.set(platform, value)
    return value
  } else {
    platformMap.set(platform, null)
    return undefined
  }
}

export const SEARCH_SYNC_API_CONFIG = (): ISearchSyncApiConfig => {
  return config.get<ISearchSyncApiConfig>('searchSyncApi')
}
