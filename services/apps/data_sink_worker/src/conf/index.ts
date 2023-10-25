import { ITemporalConfig } from '@crowd/temporal'
import { IDatabaseConfig } from '@crowd/database'
import { ISqsClientConfig } from '@crowd/sqs'
import { ISentimentClientConfig } from '@crowd/sentiment'
import config from 'config'
import { IRedisConfiguration } from '@crowd/redis'
import { IUnleashConfig } from '@crowd/feature-flags'
import { EDITION } from '@crowd/common'
import { Edition } from '@crowd/types'
export interface ISlackAlertingConfig {
  url: string
}

let redisConfig: IRedisConfiguration
export const REDIS_CONFIG = (): IRedisConfiguration => {
  if (redisConfig) return redisConfig

  redisConfig = config.get<IRedisConfiguration>('redis')
  return redisConfig
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

  if (EDITION === Edition.CROWD_HOSTED) {
    unleashConfig = config.get<IUnleashConfig>('unleash')
  }

  return unleashConfig
}

let temporalConfig: ITemporalConfig | undefined
export const TEMPORAL_CONFIG = (): ITemporalConfig | undefined => {
  if (temporalConfig) return temporalConfig

  temporalConfig = config.get<ITemporalConfig>('temporal')

  return temporalConfig
}
