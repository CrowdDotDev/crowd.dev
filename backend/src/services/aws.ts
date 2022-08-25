import { getConfig } from '../config'

const AWS = require('aws-sdk')

if (getConfig().SERVICE === 'default') {
  AWS.config.update({
    accessKeyId: getConfig().AWS_ACCESS_KEY_ID,
    secretAccessKey: getConfig().AWS_SECRET_ACCESS_KEY,
    region: 'eu-central-1',
  })
}

export const sqs =
  getConfig().NODE_ENV === 'development'
    ? new AWS.SQS({
        endpoint: `${getConfig().LOCALSTACK_HOSTNAME}:${getConfig().LOCALSTACK_PORT}`,
      })
    : new AWS.SQS()

export const s3 =
  getConfig().NODE_ENV === 'development'
    ? new AWS.S3({
        region: `eu-west-1`,
        s3ForcePathStyle: true,
        endpoint: `${getConfig().LOCALSTACK_HOSTNAME}:${getConfig().LOCALSTACK_PORT}`,
        apiVersion: '2012-10-17',
      })
    : new AWS.S3({ apiVersion: '2012-10-17' })

export const lambda =
  getConfig().NODE_ENV === 'development'
    ? new AWS.Lambda({
        endpoint: `${getConfig().LOCALSTACK_HOSTNAME}:${getConfig().LOCALSTACK_PORT}`,
      })
    : new AWS.Lambda()

export const notLocalLambda = new AWS.Lambda()

export const stepFunctions =
  getConfig().NODE_ENV === 'development'
    ? new AWS.StepFunctions({
        endpoint: `${getConfig().LOCALSTACK_HOSTNAME}:${getConfig().LOCALSTACK_PORT}`,
      })
    : new AWS.StepFunctions()
