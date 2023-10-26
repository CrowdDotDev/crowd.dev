import config from 'config'
import { IDatabaseConfig } from '@crowd/database'
import { IRedisConfiguration } from '@crowd/redis'
export interface IOpenSearchConfig {
  node: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
}

export interface IServiceConfig {
  edition: string
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

export interface ISearchSyncApiServiceConfig {
  port: number
}

let searchSyncApiConfig: ISearchSyncApiServiceConfig
export const SEARCH_SYNC_API_CONFIG = (): ISearchSyncApiServiceConfig => {
  if (searchSyncApiConfig) return searchSyncApiConfig

  searchSyncApiConfig = config.get<ISearchSyncApiServiceConfig>('service')
  return searchSyncApiConfig
}
