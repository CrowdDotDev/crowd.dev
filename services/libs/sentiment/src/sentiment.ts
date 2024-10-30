//import { getServiceChildLogger } from '@crowd/logging'
import vader from 'crowd-sentiment'

import { trimUtf8ToMaxByteLength } from '@crowd/common'

import { ISentimentAnalysisResult } from './types'

//const log = getServiceChildLogger('sentiment')

export const getSentiment = async (text: string): Promise<ISentimentAnalysisResult | undefined> => {
  const preparedText = prepareText(text)

  if (preparedText.length === 0) {
    return undefined
  }

  const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(preparedText)
  const compound = Math.round(((sentiment.compound + 1) / 2) * 100)
  // Some activities are inherently different, we might want to dampen their sentiment

  let label = 'neutral'
  if (compound < 33) {
    label = 'negative'
  } else if (compound > 66) {
    label = 'positive'
  }

  return {
    positive: Math.round(sentiment.pos * 100),
    negative: Math.round(sentiment.neg * 100),
    neutral: Math.round(sentiment.neu * 100),
    mixed: Math.round(sentiment.neu * 100),
    sentiment: compound,
    label,
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
