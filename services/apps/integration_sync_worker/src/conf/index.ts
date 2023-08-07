import { IDatabaseConfig } from '@crowd/database'
import { ISqsClientConfig } from '@crowd/sqs'
import { IOpenSearchConfig } from '@crowd/types'
import config from 'config'

export interface IServiceConfig {
  edition: string
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
