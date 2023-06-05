import { IDatabaseConfig } from '@crowd/database'
import { IRedisConfiguration } from '@crowd/redis'
import { ISqsClientConfig } from '@crowd/sqs'
import config from 'config'

export interface IWorkerSettings {
  maxDataRetries: number
}

let workerSettings: IWorkerSettings
export const WORKER_SETTINGS = (): IWorkerSettings => {
  if (workerSettings) return workerSettings

  workerSettings = config.get<IWorkerSettings>('worker')
  return workerSettings
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
