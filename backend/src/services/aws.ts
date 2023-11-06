import AWS from 'aws-sdk'
import { Comprehend } from '@aws-sdk/client-comprehend'
import { Lambda } from '@aws-sdk/client-lambda'
import { S3 } from '@aws-sdk/client-s3'
import { SFN } from '@aws-sdk/client-sfn'
import { SQS } from '@aws-sdk/client-sqs'
import { trimUtf8ToMaxByteLength } from '@crowd/common'
import { COMPREHEND_CONFIG, IS_DEV_ENV, KUBE_MODE, S3_CONFIG, SQS_CONFIG } from '../conf'

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
    ? new SQS({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },

    // The transformation for endpoint is not implemented.
    // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
    // Please create/upvote feature request on aws-sdk-js-codemod for endpoint.
    endpoint: `http://${SQS_CONFIG.host}:${SQS_CONFIG.port}`,

    ...awsSqsConfig,
    region: 'eu-central-1'
  })
    : new SQS(awsSqsConfig)

  if (S3_CONFIG.aws) {
    const awsS3Config = {
      accessKeyId: S3_CONFIG.aws.accessKeyId,
      secretAccessKey: S3_CONFIG.aws.secretAccessKey,
      region: S3_CONFIG.aws.region,
    }

    s3Instance = IS_DEV_ENV
      ? new S3({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },

      // The key s3ForcePathStyle is renamed to forcePathStyle.
      forcePathStyle: true,

      // The transformation for endpoint is not implemented.
      // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
      // Please create/upvote feature request on aws-sdk-js-codemod for endpoint.
      endpoint: `${S3_CONFIG.host}:${S3_CONFIG.port}`,

      // The transformation for apiVersion is not implemented.
      // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
      // Please create/upvote feature request on aws-sdk-js-codemod for apiVersion.
      apiVersion: '2012-10-17',

      ...awsS3Config,
      region: 'eu-central-1'
    })
      : new S3({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },

      // The transformation for apiVersion is not implemented.
      // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
      // Please create/upvote feature request on aws-sdk-js-codemod for apiVersion.
      apiVersion: '2012-10-17',

      ...awsS3Config,
      region: 'eu-central-1'
    })
  }

  comprehendInstance = COMPREHEND_CONFIG.aws.accessKeyId
    ? new Comprehend({
    credentials: {
      accessKeyId: COMPREHEND_CONFIG.aws.accessKeyId,
      secretAccessKey: COMPREHEND_CONFIG.aws.secretAccessKey
    },

    region: COMPREHEND_CONFIG.aws.region
  })
    : undefined
} else {
  if (process.env.SERVICE === 'default') {
    // JS SDK v3 does not support global configuration.
    // Codemod has attempted to pass values to each service client in this file.
    // You may need to update clients outside of this file, if they use global config.
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: 'eu-central-1',
    })
  }

  sqsInstance =
    process.env.NODE_ENV === 'development'
      ? new SQS({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },

      // The transformation for endpoint is not implemented.
      // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
      // Please create/upvote feature request on aws-sdk-js-codemod for endpoint.
      endpoint: `${process.env.LOCALSTACK_HOSTNAME}:${process.env.LOCALSTACK_PORT}`,

      region: 'eu-central-1'
    })
      : new SQS({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },

      region: 'eu-central-1'
    })

  s3Instance =
    process.env.NODE_ENV === 'development'
      ? new S3({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },

      region: `eu-west-1`,

      // The key s3ForcePathStyle is renamed to forcePathStyle.
      forcePathStyle: true,

      // The transformation for endpoint is not implemented.
      // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
      // Please create/upvote feature request on aws-sdk-js-codemod for endpoint.
      endpoint: `${process.env.LOCALSTACK_HOSTNAME}:${process.env.LOCALSTACK_PORT}`,

      // The transformation for apiVersion is not implemented.
      // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
      // Please create/upvote feature request on aws-sdk-js-codemod for apiVersion.
      apiVersion: '2012-10-17'
    })
      : new S3({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },

      // The transformation for apiVersion is not implemented.
      // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
      // Please create/upvote feature request on aws-sdk-js-codemod for apiVersion.
      apiVersion: '2012-10-17',

      region: 'eu-central-1'
    })

  lambdaInstance =
    process.env.NODE_ENV === 'development'
      ? new Lambda({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },

      // The transformation for endpoint is not implemented.
      // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
      // Please create/upvote feature request on aws-sdk-js-codemod for endpoint.
      endpoint: `${process.env.LOCALSTACK_HOSTNAME}:${process.env.LOCALSTACK_PORT}`,

      region: 'eu-central-1'
    })
      : new Lambda({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },

      region: 'eu-central-1'
    })

  notLocalLambdaInstance = new Lambda({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },

    region: 'eu-central-1'
  })

  stepFunctionsInstance =
    process.env.NODE_ENV === 'development'
      ? new SFN({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },

      // The transformation for endpoint is not implemented.
      // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
      // Please create/upvote feature request on aws-sdk-js-codemod for endpoint.
      endpoint: `${process.env.LOCALSTACK_HOSTNAME}:${process.env.LOCALSTACK_PORT}`,

      region: 'eu-central-1'
    })
      : new SFN({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },

      region: 'eu-central-1'
    })

  comprehendInstance =
    process.env.AWS_ACCESS_KEY_ID !== 'aws-key-id' &&
    process.env.AWS_ACCESS_KEY_ID !== 'none' &&
    process.env.AWS_SECRET_ACCESS_KEY !== 'aws-secret-access-key' &&
    process.env.AWS_SECRET_ACCESS_KEY !== 'none' &&
    process.env.AWS_ACCESS_KEY_ID !== undefined &&
    process.env.AWS_SECRET_ACCESS_KEY !== undefined
      ? new Comprehend({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },

      region: 'eu-central-1'
    })
      : undefined
}

const ALLOWED_MAX_BYTE_LENGTH = 5000

/**
 * Get sentiment for a text using AWS Comprehend
 * @param text Text to detect sentiment on
 * @returns Sentiment object
 */
export async function detectSentiment(text) {
  // Only if we have proper credentials
  if (comprehendInstance) {
    // https://docs.aws.amazon.com/comprehend/latest/APIReference/API_DetectSentiment.html
    // needs to be utf-8 encoded
    text = Buffer.from(text).toString('utf8')
    // from docs - AWS performs analysis on the first 500 characters and ignores the rest
    text = text.slice(0, 500)
    // trim down to max allowed byte length
    text = trimUtf8ToMaxByteLength(text, ALLOWED_MAX_BYTE_LENGTH)

    const params = {
      LanguageCode: 'en',
      Text: text,
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
      sentiment: Math.round(50 + (positive - negative) / 2),
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
        sentiment: Math.round(50 + (positive - negative) / 2),
      }
    })

    return batchSentimentResults
  }
  return {}
}

export const getCurrentQueueSize = async (sqs: SQS, queue: string): Promise<number> => {
  const result = await sqs
    .getQueueAttributes({
      QueueUrl: queue,
      AttributeNames: ['ApproximateNumberOfMessages'],
    })

  if (result.Attributes) {
    return parseInt(result.Attributes.ApproximateNumberOfMessages, 10)
  }

  return null
}

export const sqs: SQS = sqsInstance
export const s3 = s3Instance
export const lambda = lambdaInstance
export const notLocalLambda = notLocalLambdaInstance
export const stepFunctions = stepFunctionsInstance
