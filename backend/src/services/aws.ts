import AWS, { SQS } from 'aws-sdk'
import { IS_DEV_ENV, KUBE_MODE, S3_CONFIG, SQS_CONFIG } from '../config'

let sqsInstance
let s3Instance
let lambdaInstance
let notLocalLambdaInstance
let stepFunctionsInstance

// TODO-kube
if (KUBE_MODE) {
  const awsSqsConfig = {
    accessKeyId: SQS_CONFIG.aws.accessKeyId,
    secretAccessKey: SQS_CONFIG.aws.secretAccessKey,
    region: SQS_CONFIG.aws.region,
  }

  sqsInstance = IS_DEV_ENV
    ? new AWS.SQS({
        endpoint: `http://${SQS_CONFIG.host}:${SQS_CONFIG.port}`,
        ...awsSqsConfig,
      })
    : new AWS.SQS(awsSqsConfig)

  if (S3_CONFIG.aws) {
    const awsS3Config = {
      accessKeyId: S3_CONFIG.aws.accessKeyId,
      secretAccessKey: S3_CONFIG.aws.secretAccessKey,
      region: S3_CONFIG.aws.region,
    }

    s3Instance = IS_DEV_ENV
      ? new AWS.S3({
          s3ForcePathStyle: true,
          endpoint: `${S3_CONFIG.host}:${S3_CONFIG.port}`,
          apiVersion: '2012-10-17',
          ...awsS3Config,
        })
      : new AWS.S3({ apiVersion: '2012-10-17', ...awsS3Config })
  }
} else {
  if (process.env.SERVICE === 'default') {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: 'eu-central-1',
    })
  }

  sqsInstance =
    process.env.NODE_ENV === 'development'
      ? new AWS.SQS({
          endpoint: `${process.env.LOCALSTACK_HOSTNAME}:${process.env.LOCALSTACK_PORT}`,
        })
      : new AWS.SQS()

  s3Instance =
    process.env.NODE_ENV === 'development'
      ? new AWS.S3({
          region: `eu-west-1`,
          s3ForcePathStyle: true,
          endpoint: `${process.env.LOCALSTACK_HOSTNAME}:${process.env.LOCALSTACK_PORT}`,
          apiVersion: '2012-10-17',
        })
      : new AWS.S3({ apiVersion: '2012-10-17' })

  lambdaInstance =
    process.env.NODE_ENV === 'development'
      ? new AWS.Lambda({
          endpoint: `${process.env.LOCALSTACK_HOSTNAME}:${process.env.LOCALSTACK_PORT}`,
        })
      : new AWS.Lambda()

  notLocalLambdaInstance = new AWS.Lambda()

  stepFunctionsInstance =
    process.env.NODE_ENV === 'development'
      ? new AWS.StepFunctions({
          endpoint: `${process.env.LOCALSTACK_HOSTNAME}:${process.env.LOCALSTACK_PORT}`,
        })
      : new AWS.StepFunctions()
}

export const sqs: SQS = sqsInstance
export const s3 = s3Instance
export const lambda = lambdaInstance
export const notLocalLambda = notLocalLambdaInstance
export const stepFunctions = stepFunctionsInstance
