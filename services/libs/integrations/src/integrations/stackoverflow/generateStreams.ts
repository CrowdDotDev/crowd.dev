import { GenerateStreamsHandler } from '../../types'

import {
  IStackOverflowIntegrationSettings,
  IStackOverflowKeywordStreamData,
  IStackOverflowTagStreamData,
  StackOverflowRootStream,
} from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings as IStackOverflowIntegrationSettings

  ctx.log.info(
    {
      integrationId: ctx.integration.id,
      tagsCount: settings?.tags?.length ?? 0,
      keywordsCount: settings?.keywords?.length ?? 0,
      tags: settings?.tags,
      keywords: settings?.keywords,
    },
    'StackOverflow generateStreams: starting',
  )

  if (settings.keywords.length === 0 && settings.tags.length === 0) {
    await ctx.abortRunWithError('No keywords or tags configured!')
    return
  }

  let streamsPublished = 0

  if (settings.tags.length > 0) {
    for (const tag of settings.tags) {
      ctx.log.info({ tag }, 'StackOverflow: publishing tag stream')
      await ctx.publishStream<IStackOverflowTagStreamData>(
        `${StackOverflowRootStream.QUESTIONS_BY_TAG}:${tag}:${1}`,
        {
          tags: [tag],
          page: 1,
        },
      )
      streamsPublished++
    }
  }
  if (settings.keywords.length > 0) {
    for (const keyword of settings.keywords) {
      ctx.log.info({ keyword }, 'StackOverflow: publishing keyword stream')
      await ctx.publishStream<IStackOverflowKeywordStreamData>(
        `${StackOverflowRootStream.QUESTIONS_BY_KEYWORD}:${keyword}:${1}`,
        {
          keyword,
          page: 1,
        },
      )
      streamsPublished++
    }
  }

  ctx.log.info(
    { streamsPublished, integrationId: ctx.integration.id },
    'StackOverflow generateStreams: completed',
  )
}

export default handler
