import AWS from 'aws-sdk'
import { IS_DEV_ENV, SQS_CONFIG, S3_CONFIG } from '../config'

const awsSqsConfig = {
  accessKeyId: SQS_CONFIG.aws.accessKeyId,
  secretAccessKey: SQS_CONFIG.aws.secretAccessKey,
  region: SQS_CONFIG.aws.region,
}

export const SQS = IS_DEV_ENV
  ? new AWS.SQS({
      endpoint: `${SQS_CONFIG.host}:${SQS_CONFIG.port}`,
      ...awsSqsConfig,
    })
  : new AWS.SQS(awsSqsConfig)

const awsS3Config = {
  accessKeyId: S3_CONFIG.aws.accessKeyId,
  secretAccessKey: S3_CONFIG.aws.secretAccessKey,
  region: S3_CONFIG.aws.region,
}

export const s3 = IS_DEV_ENV
  ? new AWS.S3({
      s3ForcePathStyle: true,
      endpoint: `${S3_CONFIG.host}:${S3_CONFIG.port}`,
      apiVersion: '2012-10-17',
      ...awsS3Config,
    })
  : new AWS.S3({ apiVersion: '2012-10-17', ...awsS3Config })
