import config from 'config'

import { IDatabaseConfig } from '@crowd/data-access-layer/src/database'
import { IQueueClientConfig } from '@crowd/queue'
import { IOpenSearchConfig, QueuePriorityLevel } from '@crowd/types'

export interface IServiceConfig {
  edition: string
  queuePriorityLevel: QueuePriorityLevel
}
export interface INangoConfig {
  url: string
  secretKey: string
}

let serviceConfig: IServiceConfig
export const SERVICE_CONFIG = (): IServiceConfig => {
  if (serviceConfig) return serviceConfig

  serviceConfig = config.get<IServiceConfig>('service')
  return serviceConfig
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

let openSearchConfig: IOpenSearchConfig
export const OPENSEARCH_CONFIG = (): IOpenSearchConfig => {
  if (openSearchConfig) return openSearchConfig

  openSearchConfig = config.get<IOpenSearchConfig>('opensearch')
  return openSearchConfig
}

let nangoConfig: INangoConfig
export const NANGO_CONFIG = (): INangoConfig => {
  if (nangoConfig) return nangoConfig

  nangoConfig = config.get<INangoConfig>('nango')
  return nangoConfig
}
