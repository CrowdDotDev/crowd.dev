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

/**
 * Get sentiment for a text using AWS Comprehend
 * @param text Text to detect sentiment on
 * @returns Sentiment object
 */
export async function detectSentiment(text) {
  // Only if we have proper credentials
  if (
    getConfig().AWS_ACCESS_KEY_ID !== 'aws-key-id' &&
    getConfig().AWS_SECRET_ACCESS_KEY !== 'aws-secret-access-key' &&
    getConfig().AWS_ACCESS_KEY_ID !== undefined &&
    getConfig().AWS_SECRET_ACCESS_KEY !== undefined
  ) {
    const comprehend = new AWS.Comprehend()
    const params = {
      LanguageCode: 'en',
      Text: text,
    }
    const fromAWS = await comprehend.detectSentiment(params).promise()
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
