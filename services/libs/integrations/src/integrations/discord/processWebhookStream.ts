import {
  ProcessWebhookStreamHandler,
  IProcessWebhookStreamContext,
  IProcessStreamContext,
} from '@/types'
import { DiscordWebsocketPayload, DiscordWebsocketEvent } from '@crowd/types'
import { getMessage } from './api/getMessage'
import { getDiscordToken } from './processStream'
import { getChannel } from './api/getChannel'
import { isDiscordForum, isDiscordThread } from './processStream'
import {
  IDiscordAPIData,
  DiscordApiDataMessage,
  DiscordApiChannel,
  DiscordAPIDataType,
} from './types'
import { cacheDiscordChannels } from './processStream'
import { getMember } from './api/getMember'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseWebhookMessage = async (payload: any, ctx: IProcessWebhookStreamContext) => {
  const record = await getMessage(
    payload.channelId,
    payload.id,
    getDiscordToken(ctx as IProcessStreamContext),
    ctx as IProcessStreamContext,
  )

  let parent: string | undefined
  let parentChannel: string | undefined

  let firstThreadMessage = false
  // is the message starting a thread? if so we should get thread messages as well
  if (record.thread) {
    firstThreadMessage = true
    await cacheDiscordChannels(record.thread as DiscordApiChannel, ctx as IProcessStreamContext)
  }

  if (record.id === record.channel_id) {
    firstThreadMessage = true
  }

  const channel = await getChannel(
    record.channel_id,
    getDiscordToken(ctx as IProcessStreamContext),
    ctx as IProcessStreamContext,
  )

  let isForum = false
  const isThread = isDiscordThread(channel)

  if (isThread || isForum) {
    if (!firstThreadMessage) {
      parent = channel.id
    }

    if (channel.parent_id) {
      const parentChannelObj = await getChannel(
        channel.parent_id,
        getDiscordToken(ctx as IProcessStreamContext),
        ctx as IProcessStreamContext,
      )
      parentChannel = parentChannelObj.name
      isForum = isDiscordForum(parentChannelObj)
    }
  }
  // record.message_reference means that it's a reply
  else if (record.message_reference && record.message_reference.message_id) {
    parent = record.message_reference.message_id
  }

  await ctx.publishData<IDiscordAPIData>({
    type: DiscordAPIDataType.CHANNEL,
    data: {
      ...record,
      parent,
      parentChannel,
      isForum,
      isThread,
      channel,
    } as DiscordApiDataMessage,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseWebhookMember = async (payload: any, ctx: IProcessWebhookStreamContext) => {
  const discordMember = await getMember(
    payload.guildId,
    payload.userId,
    getDiscordToken(ctx as IProcessStreamContext),
    ctx as IProcessStreamContext,
  )

  if (discordMember) {
    await ctx.publishData<IDiscordAPIData>({
      type: DiscordAPIDataType.MEMBER,
      data: [discordMember],
    })
  }
}

const handler: ProcessWebhookStreamHandler = async (ctx) => {
  const { event, data } = ctx.stream.data as DiscordWebsocketPayload

  switch (event) {
    case DiscordWebsocketEvent.MESSAGE_CREATED: {
      await parseWebhookMessage(data, ctx)
      break
    }
    case DiscordWebsocketEvent.MESSAGE_UPDATED: {
      await parseWebhookMessage(data.message, ctx)
      break
    }

    case DiscordWebsocketEvent.MEMBER_ADDED: {
      await parseWebhookMember(data, ctx)
      break
    }

    case DiscordWebsocketEvent.MEMBER_UPDATED: {
      await parseWebhookMember(data.member, ctx)
      break
    }

    default: {
      ctx.log.error(`Unknown discord websocket event: ${event}!`)
      throw new Error(`Unknown discord websocket event: ${event}!`)
    }
  }
}

export default handler
