import { IDatabaseConfig } from '@crowd/database'
import { ISqsClientConfig } from '@crowd/sqs'
import { ISentimentClientConfig } from '@crowd/sentiment'
import config from 'config'

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
