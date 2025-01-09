import config from 'config'

import { IDatabaseConfig } from '@crowd/data-access-layer/src/database'
import { IQueueClientConfig } from '@crowd/queue'
import { IRedisConfiguration } from '@crowd/redis'
import { IGithubIssueReporterConfiguration } from '@crowd/types'

export interface IWebhookApiServiceConfig {
  port: number
}

let webhookApiConfig: IWebhookApiServiceConfig
export const WEBHOOK_API_CONFIG = (): IWebhookApiServiceConfig => {
  if (webhookApiConfig) return webhookApiConfig

  webhookApiConfig = config.get<IWebhookApiServiceConfig>('service')
  return webhookApiConfig
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

let redisConfig: IRedisConfiguration
export const REDIS_CONFIG = (): IRedisConfiguration => {
  if (redisConfig) return redisConfig

  redisConfig = config.get<IRedisConfiguration>('redis')
  return redisConfig
}

let githubIssueReporterConfig: IGithubIssueReporterConfiguration
export const GITHUB_ISSUE_REPORTER_CONFIG = (): IGithubIssueReporterConfiguration => {
  if (githubIssueReporterConfig) return githubIssueReporterConfig

  githubIssueReporterConfig = config.get<IGithubIssueReporterConfiguration>('githubIssueReporter')
  return githubIssueReporterConfig
}
