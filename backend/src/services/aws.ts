import AWS, { SQS } from 'aws-sdk'
import { COMPREHEND_CONFIG, IS_DEV_ENV, KUBE_MODE, S3_CONFIG, SQS_CONFIG } from '../config/index'

let sqsInstance
let s3Instance
let lambdaInstance
let notLocalLambdaInstance
let stepFunctionsInstance
let comprehendInstance

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

  comprehendInstance = COMPREHEND_CONFIG.aws.accessKeyId
    ? new AWS.Comprehend({
        accessKeyId: COMPREHEND_CONFIG.aws.accessKeyId,
        secretAccessKey: COMPREHEND_CONFIG.aws.secretAccessKey,
        region: COMPREHEND_CONFIG.aws.region,
      })
    : undefined

  comprehendInstance = undefined

  if (COMPREHEND_CONFIG.aws.accessKeyId) {
    comprehendInstance = new AWS.Comprehend({
      accessKeyId: COMPREHEND_CONFIG.aws.accessKeyId,
      secretAccessKey: COMPREHEND_CONFIG.aws.secretAccessKey,
      region: COMPREHEND_CONFIG.aws.region,
    })
  } else if (
    process.env.AWS_ACCESS_KEY_ID !== 'aws-key-id' &&
    process.env.AWS_ACCESS_KEY_ID !== 'none' &&
    process.env.AWS_SECRET_ACCESS_KEY !== 'aws-secret-access-key' &&
    process.env.AWS_SECRET_ACCESS_KEY !== 'none' &&
    process.env.AWS_ACCESS_KEY_ID !== undefined &&
    process.env.AWS_SECRET_ACCESS_KEY !== undefined
  ) {
    comprehendInstance = new AWS.Comprehend({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    })
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

  comprehendInstance =
    process.env.AWS_ACCESS_KEY_ID !== 'aws-key-id' &&
    process.env.AWS_ACCESS_KEY_ID !== 'none' &&
    process.env.AWS_SECRET_ACCESS_KEY !== 'aws-secret-access-key' &&
    process.env.AWS_SECRET_ACCESS_KEY !== 'none' &&
    process.env.AWS_ACCESS_KEY_ID !== undefined &&
    process.env.AWS_SECRET_ACCESS_KEY !== undefined
      ? new AWS.Comprehend()
      : undefined
}

/**
 * Get sentiment for a text using AWS Comprehend
 * @param text Text to detect sentiment on
 * @returns Sentiment object
 */
export async function detectSentiment(text) {
  // Only if we have proper credentials
  if (comprehendInstance) {
    const params = {
      LanguageCode: 'en',
      Text: text.slice(0, 300),
    }
    const fromAWS = await comprehendInstance.detectSentiment(params).promise()
    const positive = 100 * fromAWS.SentimentScore.Positive
    const negative = 100 * fromAWS.SentimentScore.Negative
    return {
      label: fromAWS.Sentiment.toLowerCase(),
      positive,
      negative,
      neutral: 100 * fromAWS.SentimentScore.Neutral,
      mixed: 100 * fromAWS.SentimentScore.Mixed,
      // Mapping the value from -1,1 to 0,100
      // Get a magnitude of the difference between the two values,
      // normalised by how much of the 4 dimensions they take:
      //   (positive - negative) / (positive + negative)
      //   Value between -1 and 1
      // Then scale it to 0,100
      sentiment: Math.round(100 * ((positive - negative) / (2 * (positive + negative)) + 0.5)),
    }
  }
  return {}
}

export async function detectSentimentBatch(textArray) {
  if (comprehendInstance) {
    const params = {
      LanguageCode: 'en',
      TextList: textArray,
    }
    const fromAWSBatch = await comprehendInstance.batchDetectSentiment(params).promise()

    const batchSentimentResults = fromAWSBatch.ResultList.map((i) => {
      const positive = 100 * i.SentimentScore.Positive
      const negative = 100 * i.SentimentScore.Negative
      return {
        label: i.Sentiment.toLowerCase(),
        positive,
        negative,
        neutral: 100 * i.SentimentScore.Neutral,
        mixed: 100 * i.SentimentScore.Mixed,
        sentiment: Math.round(100 * ((positive - negative) / (2 * (positive + negative)) + 0.5)),
      }
    })

    return batchSentimentResults
  }
  return {}
}

export const sqs: SQS = sqsInstance
export const s3 = s3Instance
export const lambda = lambdaInstance
export const notLocalLambda = notLocalLambdaInstance
export const stepFunctions = stepFunctionsInstance
