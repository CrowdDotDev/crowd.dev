import {
  BatchDetectSentimentCommand,
  ComprehendClient,
  DetectSentimentCommand,
  DetectSentimentResponse,
  LanguageCode,
} from '@aws-sdk/client-comprehend'
import { IS_DEV_ENV } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { getComprehendClient } from './client'
import { ISentimentAnalysisResult, ISentimentClientConfig } from './types'
import { trimUtf8ToMaxByteLength } from '@crowd/common'

const log = getServiceChildLogger('sentiment')

let client: ComprehendClient | undefined

export const initializeSentimentAnalysis = (config: ISentimentClientConfig) => {
  client = getComprehendClient(config)
  log.info('Initialized sentiment analysis client!')
}

export const getSentiment = async (text: string): Promise<ISentimentAnalysisResult | undefined> => {
  if (IS_DEV_ENV) {
    if (text === undefined) {
      return undefined
    }
    // Return a random number between 0 and 100
    const score = Math.floor(Math.random() * 100)
    let label = 'neutral'
    if (score < 33) {
      label = 'negative'
    } else if (score > 66) {
      label = 'positive'
    }
    return {
      positive: Math.floor(Math.random() * 100),
      negative: Math.floor(Math.random() * 100),
      neutral: Math.floor(Math.random() * 100),
      mixed: Math.floor(Math.random() * 100),
      sentiment: score,
      label,
    }
  }

  if (!client) {
    throw new Error(
      'Sentiment analysis not initialized yet! Please call initializeSentimentAnalysis method first!',
    )
  }

  const preparedText = prepareText(text)

  if (preparedText.length === 0) {
    return undefined
  }

  const params = {
    Text: preparedText,
    LanguageCode: LanguageCode.EN,
  }

  try {
    const result = await client.send(new DetectSentimentCommand(params))
    return mapResult(result)
  } catch (err) {
    log.error(err, { inputText: text }, 'Error getting sentiment!')
    throw err
  }
}

export const getSentimentBatch = async (
  textArray: string[],
): Promise<ISentimentAnalysisResult[]> => {
  if (IS_DEV_ENV) {
    if (textArray === undefined || textArray.length === 0) {
      return []
    }

    return textArray.map(() => {
      // Return a random number between 0 and 100
      const score = Math.floor(Math.random() * 100)
      let label = 'neutral'
      if (score < 33) {
        label = 'negative'
      } else if (score > 66) {
        label = 'positive'
      }
      return {
        positive: Math.floor(Math.random() * 100),
        negative: Math.floor(Math.random() * 100),
        neutral: Math.floor(Math.random() * 100),
        mixed: Math.floor(Math.random() * 100),
        sentiment: score,
        label,
      }
    })
  }

  if (!client) {
    throw new Error(
      'Sentiment analysis not initialized yet! Please call initializeSentimentAnalysis method first!',
    )
  }

  const params = {
    TextList: textArray.map(prepareText),
    LanguageCode: LanguageCode.EN,
  }

  try {
    const result = await client.send(new BatchDetectSentimentCommand(params))
    return result.ResultList.map(mapResult)
  } catch (err) {
    log.error(err, { inputTextArray: textArray }, 'Error getting sentiment!')
    throw err
  }
}

const mapResult = (result: DetectSentimentResponse): ISentimentAnalysisResult => {
  const positive = 100 * result.SentimentScore.Positive
  const negative = 100 * result.SentimentScore.Negative
  return {
    label: result.Sentiment.toLowerCase(),
    positive,
    negative,
    neutral: 100 * result.SentimentScore.Neutral,
    mixed: 100 * result.SentimentScore.Mixed,
    // Mapping the value from -1,1 to 0,100
    // Get a magnitude of the difference between the two values,
    // normalised by how much of the 4 dimensions they take:
    //   (positive - negative) / (positive + negative)
    //   Value between -1 and 1
    // Then scale it to 0,100
    sentiment: Math.round(50 + (positive - negative) / 2),
  }
}

const ALLOWED_MAX_BYTE_LENGTH = 5000

const prepareText = (text: string): string => {
  // https://docs.aws.amazon.com/comprehend/latest/APIReference/API_DetectSentiment.html
  // needs to be utf-8 encoded
  let prepared = Buffer.from(text).toString('utf8')
  // from docs - AWS performs analysis on the first 500 characters and ignores the rest

  // Remove Non-ASCII characters
  // eslint-disable-next-line no-control-regex
  prepared = prepared.replace(/[^\x00-\x7F]/g, '')

  prepared = prepared.slice(0, 500)
  // trim down to max allowed byte length
  prepared = trimUtf8ToMaxByteLength(prepared, ALLOWED_MAX_BYTE_LENGTH)

  return prepared.trim()
}
