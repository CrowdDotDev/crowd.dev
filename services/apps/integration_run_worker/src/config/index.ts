import { IDatabaseConfig } from '@crowd/database'
import { IRedisConfiguration } from '@crowd/redis'
import { ISqsClientConfig } from '@crowd/sqs'
import config = require('config')

export interface INangoConfig {
  url: string
  secretKey: string
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

let platformConfig: unknown | null | undefined = null
export const PLATFORM_CONFIG = (platform: string): unknown | undefined => {
  if (platformConfig === null) {
    if (config.has(platform)) {
      platformConfig = config.get(platform)
    } else {
      platformConfig = undefined
    }
  }

  return platformConfig
}
