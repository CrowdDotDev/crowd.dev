import AWS, { SQS } from 'aws-sdk'
import { IS_DEV_ENV, SQS_CONFIG } from './config'

const awsSqsConfig = {
  accessKeyId: SQS_CONFIG.aws.accessKeyId,
  secretAccessKey: SQS_CONFIG.aws.secretAccessKey,
  region: SQS_CONFIG.aws.region,
}

const sqsInstance = IS_DEV_ENV
  ? new AWS.SQS({
      endpoint: `http://${SQS_CONFIG.host}:${SQS_CONFIG.port}`,
      ...awsSqsConfig,
    })
  : new AWS.SQS(awsSqsConfig)

export const sqs: SQS = sqsInstance
