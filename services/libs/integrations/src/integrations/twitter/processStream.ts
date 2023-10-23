import { ProcessStreamHandler } from '../../types'
import {
  TwitterStreamType,
  TwitterMentionsStreamData,
  TwitterHashtagStreamData,
  TwitterPublishData,
} from './types'
import getPostsByMention from './api/getPostsByMention'
import getPostsByHashtag from './api/getPostsByHashtag'
import { RateLimitError } from '@crowd/types'

const processMentionsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as TwitterMentionsStreamData

  const { records, nextPage, limit, timeUntilReset } = await getPostsByMention(
    {
      token: ctx.integration.token,
      page: data.page,
      perPage: 100,
      profileId: ctx.integration.identifier,
    },
    ctx,
  )

  const sleep = limit <= 1 ? timeUntilReset : undefined

  if (sleep) {
    throw new RateLimitError(sleep, 'twitter/mentions')
  }

  if (records && records.length && records.length > 0) {
    for (const rec of records) {
      await ctx.publishData<TwitterPublishData>({
        type: TwitterStreamType.MENTIONS,
        data: rec,
      })
    }
  }

  if (nextPage) {
    await ctx.publishStream<TwitterMentionsStreamData>(
      `${TwitterStreamType.MENTIONS}:${nextPage}`,
      {
        page: nextPage,
      },
    )
  }
}

const processHashtagStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as TwitterHashtagStreamData

  const { records, nextPage, limit, timeUntilReset } = await getPostsByHashtag(
    {
      token: ctx.integration.token,
      page: data.page,
      perPage: 100,
      hashtag: data.hashtag,
    },
    ctx,
  )

  const sleep = limit <= 1 ? timeUntilReset : undefined

  if (sleep) {
    throw new RateLimitError(sleep, 'twitter/hashtag')
  }

  if (records && records.length && records.length > 0) {
    for (const rec of records) {
      await ctx.publishData<TwitterPublishData>({
        type: TwitterStreamType.HASHTAG,
        data: rec,
        hashtag: data.hashtag,
      })
    }
  }

  if (nextPage) {
    await ctx.publishStream<TwitterHashtagStreamData>(`${TwitterStreamType.HASHTAG}:${nextPage}`, {
      page: nextPage,
      hashtag: data.hashtag,
    })
  }
}

const handler: ProcessStreamHandler = async (ctx) => {
  const streamIdentifier = ctx.stream.identifier.split(':')

  switch (streamIdentifier[0]) {
    case TwitterStreamType.MENTIONS:
      await processMentionsStream(ctx)
      break
    case TwitterStreamType.HASHTAG:
      await processHashtagStream(ctx)
      break
    default:
      throw new Error(`Unknown stream identifier: ${ctx.stream.identifier}`)
  }
}

export default handler
