import { ProcessStreamHandler, IProcessStreamContext } from '@/types'
import {
  DiscordStreamType,
  DiscordRootStreamData,
  IDiscordPlatformSettings,
  DiscordApiChannel,
  DiscordMemberStreamData,
  IDiscordAPIData,
  DiscordApiMessage,
  DiscordApiDataMessage,
} from './types'
import getChannels from './api/getChannels'
import { getChannel } from './api/getChannel'
import getThreads from './api/getThreads'
import getMembers from './api/getMembers'
import { ChannelType } from './externalTypes'
import { DiscordChannelStreamData } from './types'
import { timeout } from '@crowd/common'
import { RateLimitError } from '@crowd/types'
import getMessages from './api/getMessages'

function isDiscordForum(channel: DiscordApiChannel): boolean {
  return channel.type === ChannelType.GuildForum
}

function isDiscordThread(channel: DiscordApiChannel): boolean {
  return channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread
}

const cacheDiscordChannels = async (
  channel: DiscordApiChannel,
  ctx: IProcessStreamContext,
): Promise<void> => {
  const cacheKey = `discord:channels:${channel}`

  const prefix = (key: string): string => `${cacheKey}:${key}`

  await ctx.cache.set(prefix(channel.id), JSON.stringify(channel), 24 * 60 * 60)
}

const getDiscordToken = (ctx: IProcessStreamContext): string => {
  const token = ctx.platformSettings as IDiscordPlatformSettings
  return `Bot ${token.token}`
}

const processRootStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as DiscordRootStreamData
  const guildId = data.guildId

  const fromDiscordApi = await getChannels(
    {
      guildId,
      token: getDiscordToken(ctx),
    },
    ctx,
  )

  for (const channel of fromDiscordApi) {
    await cacheDiscordChannels(channel, ctx)
  }

  const threads = await getThreads(
    {
      guildId,
      token: getDiscordToken(ctx),
    },
    ctx,
  )

  // we are only interested in threads that are in a forum channel because the rest we will get normally when a message has thread property attached
  for (const thread of threads) {
    await cacheDiscordChannels(thread, ctx)
    const parentChannel = await getChannel(thread.parent_id, getDiscordToken(ctx), ctx)
    if (isDiscordForum(parentChannel)) {
      fromDiscordApi.push(thread)
    }
  }

  // publishing stream to get members
  await ctx.publishStream<DiscordMemberStreamData>(DiscordStreamType.MEMBERS, {
    page: '',
    guildId,
    channels: fromDiscordApi,
  })

  for (const channel of fromDiscordApi) {
    await ctx.publishStream<DiscordChannelStreamData>(
      `${DiscordStreamType.CHANNEL}:${channel.id}`,
      {
        channelId: channel.id,
        guildId,
        page: '',
        channels: fromDiscordApi,
      },
    )
  }
}

const processMembersStream: ProcessStreamHandler = async (ctx) => {
  await timeout(2000)
  const data = ctx.stream.data as DiscordMemberStreamData

  const members = await getMembers(
    {
      guildId: data.guildId,
      token: getDiscordToken(ctx),
      page: data.page,
      perPage: 100,
    },
    ctx,
  )

  if (members.nextPage) {
    await ctx.publishStream<DiscordMemberStreamData>(
      `${DiscordStreamType.MEMBERS}:${members.nextPage}`,
      {
        page: members.nextPage,
        guildId: data.guildId,
        channels: data.channels,
      },
    )
  }

  const sleep = members.limit <= 1 ? members.timeUntilReset : undefined

  if (members.records.length > 0) {
    await ctx.publishData<IDiscordAPIData>({
      type: 'member',
      data: members.records,
    })
  }

  if (sleep) {
    throw new RateLimitError(sleep, 'getMembers')
  }
}

const processChannelStream: ProcessStreamHandler = async (ctx) => {
  await timeout(2000)
  const data = ctx.stream.data as DiscordChannelStreamData

  const channel = await getMessages(
    {
      channelId: data.channelId,
      token: getDiscordToken(ctx),
      page: data.page,
      perPage: 100,
    },
    ctx,
  )

  if (channel.nextPage) {
    await ctx.publishStream<DiscordChannelStreamData>(
      `${DiscordStreamType.CHANNEL}:${data.channelId}:${channel.nextPage}`,
      {
        channelId: data.channelId,
        guildId: data.guildId,
        page: channel.nextPage,
        channels: data.channels,
      },
    )
  }

  for (const record of channel.records as DiscordApiMessage[]) {
    let parent: string | undefined
    let parentChannel: string | undefined

    let firstThreadMessage = false
    // is the message starting a thread? if so we should get thread messages as well
    if (record.thread) {
      await ctx.publishStream<DiscordChannelStreamData>(
        `${DiscordStreamType.CHANNEL}:${record.thread.id}`,
        {
          channelId: record.thread.id,
          guildId: data.guildId,
          page: '',
          channels: data.channels,
        },
      )

      firstThreadMessage = true
      await cacheDiscordChannels(record.thread as DiscordApiChannel, ctx)
    }

    if (record.id === record.channel_id) {
      firstThreadMessage = true
    }

    const channel = await getChannel(record.channel_id, getDiscordToken(ctx), ctx)

    let isForum = false
    const isThread = isDiscordThread(channel)

    if (isThread || isForum) {
      if (!firstThreadMessage) {
        parent = channel.id
      }

      if (channel.parent_id) {
        const parentChannelObj = await getChannel(channel.parent_id, getDiscordToken(ctx), ctx)
        parentChannel = parentChannelObj.name
        isForum = isDiscordForum(parentChannelObj)
      }
    }
    // record.parentId means that it's a reply
    else if (record.message_reference && record.message_reference.message_id) {
      parent = record.message_reference.message_id
    }

    await ctx.publishData<IDiscordAPIData>({
      type: 'channel',
      data: {
        ...record,
        parent,
        parentChannel,
        isForum,
        isThread,
      } as DiscordApiDataMessage,
    })
  }
}

const handler: ProcessStreamHandler = async (ctx) => {
  const streamIdentifier = ctx.stream.identifier

  if (streamIdentifier.startsWith(DiscordStreamType.ROOT)) {
    await processRootStream(ctx)
  } else if (streamIdentifier.startsWith(DiscordStreamType.MEMBERS)) {
    await processMembersStream(ctx)
  } else if (streamIdentifier.startsWith(DiscordStreamType.CHANNEL)) {
    await processChannelStream(ctx)
  } else {
    await ctx.abortRunWithError(`Unknown stream type: ${streamIdentifier}`)
  }
}

export default handler
