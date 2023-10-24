import { ProcessStreamHandler } from '../../types'
import {
  TwitterStreamType,
  TwitterMentionsStreamData,
  TwitterHashtagStreamData,
  TwitterPublishData,
  TwitterReachStreamData,
} from './types'
import getPostsByMention from './api/getPostsByMention'
import getPostsByHashtag from './api/getPostsByHashtag'
import getProfiles from './api/getProfiles'
import { PlatformType, RateLimitError } from '@crowd/types'
import { processPaginated } from '@crowd/common'
import { generateUUIDv4 } from '@crowd/common'

interface ReachSelection {
  id: string
  username: string
}

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

const processReachStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as TwitterReachStreamData
  const usernames = data.usernames

  if (!usernames) {
    // this is the initial stream, we need to get all the usernames
    const perPage = 100
    const db = ctx.getDbConnection()

    ctx.log.info('Getting all usernames for reach update', { int: ctx.integration })

    await processPaginated<ReachSelection>(
      async (page) => {
        const result = await db.any(
          `
          SELECT
            m."memberId" as id,
            m.username as username
          FROM
            "memberIdentities" m
          WHERE
            m."tenantId"= (select "tenantId" from integrations where id = $(integrationId) )
            and m.platform = $(platform)
          ORDER BY
            m."memberId"
          LIMIT $(perPage)
          OFFSET $(offset)
        `,
          {
            integrationId: ctx.integration.id,
            platform: PlatformType.TWITTER,
            perPage,
            offset: (page - 1) * perPage,
          },
        )

        return result
      },
      async (members) => {
        const usernames = members.map((m) => m.username)
        await ctx.publishStream<TwitterReachStreamData>(
          `${TwitterStreamType.REACH}:${generateUUIDv4()}`,
          {
            usernames,
          },
        )
      },
    )
  } else {
    // this is a stream for a specific set of usernames
    const { records, limit, timeUntilReset } = await getProfiles(
      {
        usernames,
        token: ctx.integration.token,
      },
      ctx,
    )

    const sleep = limit <= 1 ? timeUntilReset : undefined

    if (sleep) {
      throw new RateLimitError(sleep, 'twitter/reach')
    }

    if (records && records.length && records.length > 0) {
      for (const rec of records) {
        await ctx.publishData<TwitterPublishData>({
          type: TwitterStreamType.REACH,
          member: rec,
        })
      }
    }
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
    case TwitterStreamType.REACH:
      await processReachStream(ctx)
      break
    default:
      throw new Error(`Unknown stream identifier: ${ctx.stream.identifier}`)
  }
}

export default handler
