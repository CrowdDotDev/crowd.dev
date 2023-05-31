import { getServiceChildLogger } from '@crowd/logging'
import { ISentimentClientConfig } from './types'
import { ComprehendClient } from '@aws-sdk/client-comprehend'

const log = getServiceChildLogger('sentiment.client')

let instance: ComprehendClient | undefined

export const getComprehendClient = (config: ISentimentClientConfig): ComprehendClient => {
  if (instance) return instance

  log.info('Creating new Comprehend client...')
  instance = new ComprehendClient({
    region: config.region,
    endpoint: config.host ? `http://${config.host}:${config.port}` : undefined,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  return instance
}
