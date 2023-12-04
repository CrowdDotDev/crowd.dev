import { IDatabaseConfig } from '@crowd/database'
import { ISqsClientConfig } from '@crowd/sqs'
import config from 'config'

export interface IWebhookApiServiceConfig {
  port: number
}

let webhookApiConfig: IWebhookApiServiceConfig
export const WEBHOOK_API_CONFIG = (): IWebhookApiServiceConfig => {
  if (webhookApiConfig) return webhookApiConfig

  webhookApiConfig = config.get<IWebhookApiServiceConfig>('service')
  return webhookApiConfig
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
