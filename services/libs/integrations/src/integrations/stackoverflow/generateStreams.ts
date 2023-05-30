import { GenerateStreamsHandler } from '../../types'
import {
  IStackOverflowIntegrationSettings,
  StackOverflowRootStream,
  IStackOverflowKeywordStreamData,
  IStackOverflowTagStreamData,
} from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings as IStackOverflowIntegrationSettings

  if (settings.keywords.length === 0 && settings.tags.length === 0) {
    await ctx.abortRunWithError('No keywords or tags configured!')
    return
  }

  if (settings.tags.length > 0) {
    for (const tag of settings.tags) {
      await ctx.publishStream<IStackOverflowTagStreamData>(
        `${StackOverflowRootStream.QUESTIONS_BY_TAG}:${tag}`,
        {
          tags: [tag],
          page: 1,
        },
      )
    }
  }
  if (settings.keywords.length > 0) {
    for (const keyword of settings.keywords) {
      await ctx.publishStream<IStackOverflowKeywordStreamData>(
        `${StackOverflowRootStream.QUESTIONS_BY_KEYWORD}:${keyword}`,
        {
          keyword,
          page: 1,
        },
      )
    }
  }
}

export default handler
