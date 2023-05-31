import { DISCORD_GRID, DiscordActivityType } from '@crowd/integrations'
import { getServiceChildLogger } from '@crowd/logging'
import { RedisCache, getRedisClient } from '@crowd/redis'
import { ChannelType, MessageType } from 'discord.js'
import lodash from 'lodash'
import moment from 'moment/moment'
import { generateUUIDv1, timeout } from '@crowd/common'
import { IntegrationType, PlatformType } from '@crowd/types'
import { DISCORD_CONFIG, REDIS_CONFIG } from '../../../../conf'
import { DiscordMemberAttributes } from '../../../../database/attributes/member/discord'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { IRepositoryOptions } from '../../../../database/repositories/IRepositoryOptions'
import IntegrationRunRepository from '../../../../database/repositories/integrationRunRepository'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import {
  IIntegrationStream,
  IPendingStream,
  IProcessStreamResults,
  IProcessWebhookResults,
  IStepContext,
  IStreamResultOperation,
} from '../../../../types/integration/stepResult'
import { IntegrationRunState } from '../../../../types/integrationRunTypes'
import { NodeWorkerIntegrationProcessMessage } from '../../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { DiscordWebsocketEvent, DiscordWebsocketPayload } from '../../../../types/webhooks'
import Operations from '../../../dbOperations/operations'
import { sendNodeWorkerMessage } from '../../../utils/nodeWorkerSQS'
import {
  DiscordApiChannel,
  DiscordApiMember,
  DiscordApiMessage,
  DiscordApiUser,
  DiscordStreamProcessResult,
} from '../../types/discordTypes'
import { AddActivitiesSingle } from '../../types/messageTypes'
import { getChannel } from '../../usecases/discord/getChannel'
import getChannels from '../../usecases/discord/getChannels'
import { getMember } from '../../usecases/discord/getMember'
import getMembers from '../../usecases/discord/getMembers'
import { getMessage } from '../../usecases/discord/getMessage'
import getMessages from '../../usecases/discord/getMessages'
import getThreads from '../../usecases/discord/getThreads'
import { IntegrationServiceBase } from '../integrationServiceBase'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

const logger = getServiceChildLogger('discordIntegrationService')

export class DiscordIntegrationService extends IntegrationServiceBase {
  static readonly ENDPOINT_MAX_RETRY = 5

  static readonly MAX_RETROSPECT = DISCORD_CONFIG.maxRetrospectInSeconds || 3600

  public static token: string = `Bot ${DISCORD_CONFIG.token}`

  constructor() {
    super(IntegrationType.DISCORD, -1)

    this.globalLimit = DISCORD_CONFIG.globalLimit || 0
    this.limitResetFrequencySeconds = (DISCORD_CONFIG.limitResetFrequencyDays || 0) * 24 * 60 * 60
  }

  private static getToken(context: IStepContext): string {
    if (context.integration.token) {
      return `Bot ${context.integration.token}`
    }

    return DiscordIntegrationService.token
  }

  override async triggerIntegrationCheck(
    integrations: any[],
    options: IRepositoryOptions,
  ): Promise<void> {
    const repository = new IntegrationRunRepository(options)

    let initialDelaySeconds = 0
    const batches = lodash.chunk(integrations, 2)

    for (const batch of batches) {
      for (const integration of batch) {
        const run = await repository.create({
          integrationId: integration.id,
          tenantId: integration.tenantId,
          onboarding: false,
          state: IntegrationRunState.PENDING,
        })

        logger.info(
          { integrationId: integration.id, runId: run.id },
          'Triggering discord integration processing!',
        )

        await sendNodeWorkerMessage(
          integration.tenantId,
          new NodeWorkerIntegrationProcessMessage(run.id),
          initialDelaySeconds,
        )
      }

      initialDelaySeconds += 120
    }
  }

  async preprocess(context: IStepContext): Promise<void> {
    const settingsChannels = context.integration.settings.channels || []

    // merge forum channels and regular channels from settings
    if (context.integration.settings.forumChannels) {
      for (const forumChannel of context.integration.settings.forumChannels) {
        settingsChannels.push({
          id: forumChannel.id,
          name: forumChannel.name,
        })
      }

      context.integration.settings.channels = settingsChannels
    }

    const guildId = context.integration.integrationIdentifier

    const fromDiscordApi = await getChannels(
      {
        guildId,
        token: DiscordIntegrationService.getToken(context),
      },
      context.logger,
    )

    for (const channel of fromDiscordApi) {
      await DiscordIntegrationService.cacheChannel(channel, context)
    }

    const threads = await getThreads(
      {
        guildId,
        token: DiscordIntegrationService.getToken(context),
      },
      context.logger,
    )

    // we are only interested in threads that are in a forum channel because the rest we will get normally when a message has thread property attached
    for (const thread of threads) {
      await DiscordIntegrationService.cacheChannel(thread, context)
      const parentChannel = await DiscordIntegrationService.getChannel(thread.parent_id, context)
      if (DiscordIntegrationService.isForum(parentChannel)) {
        fromDiscordApi.push(thread)
      }
    }

    context.pipelineData = {
      channels: fromDiscordApi,
      guildId,
    }
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.serviceContext)
    await service.createPredefined(DiscordMemberAttributes)
  }

  async processWebhook(webhook: any, context: IStepContext): Promise<IProcessWebhookResults> {
    const { event, data } = webhook.payload as DiscordWebsocketPayload

    let record: AddActivitiesSingle | undefined

    switch (event) {
      case DiscordWebsocketEvent.MESSAGE_CREATED: {
        record = await DiscordIntegrationService.parseWebhookMessage(data, context)
        break
      }
      case DiscordWebsocketEvent.MESSAGE_UPDATED: {
        record = await DiscordIntegrationService.parseWebhookMessage(data.message, context)
        break
      }

      case DiscordWebsocketEvent.MEMBER_ADDED: {
        record = await DiscordIntegrationService.parseWebhookMember(data, context)
        break
      }

      case DiscordWebsocketEvent.MEMBER_UPDATED: {
        record = await DiscordIntegrationService.parseWebhookMember(data.member, context)
        break
      }

      default: {
        context.logger.error(`Unknown discord websocket event: ${event}!`)
        throw new Error(`Unknown discord websocket event: ${event}!`)
      }
    }

    if (record === undefined) {
      context.logger.warn(
        {
          event,
          webhookId: context.webhook.id,
        },
        'No record created for event!',
      )

      return {
        operations: [],
      }
    }

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: [record],
        },
      ],
    }
  }

  async getStreams(context: IStepContext): Promise<IPendingStream[]> {
    const predefined: IPendingStream[] = [
      {
        value: 'members',
        metadata: {
          page: '',
        },
      },
    ]

    return predefined.concat(
      context.pipelineData.channels.map((c) => ({
        value: 'channel',
        metadata: {
          id: c.id,
          page: '',
        },
      })),
    )
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    // sleep for 2 seconds for rate limit
    await timeout(2000)
    for (
      let retryCount = 0;
      retryCount < DiscordIntegrationService.ENDPOINT_MAX_RETRY;
      retryCount++
    ) {
      try {
        const { fn, arg } = DiscordIntegrationService.getUsecase(
          stream,
          context.pipelineData.guildId,
        )
        const { records, nextPage, limit, timeUntilReset } = await fn(
          {
            ...arg,
            token: DiscordIntegrationService.getToken(context),
            page: stream.metadata.page,
            perPage: 100,
          },
          context.logger,
        )

        const nextPageStream = nextPage
          ? { value: stream.value, metadata: { ...stream.metadata, page: nextPage } }
          : undefined

        const sleep = limit <= 1 ? timeUntilReset : undefined

        if (records.length === 0) {
          return {
            operations: [],
            nextPageStream,
            sleep,
          }
        }

        const { activities, newStreams } = await this.parseActivities(stream, context, records)

        const lastRecord = activities.length > 0 ? activities[activities.length - 1] : undefined
        return {
          operations: [
            {
              type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
              records: activities,
            },
          ],
          lastRecord,
          lastRecordTimestamp: lastRecord ? lastRecord.timestamp.getTime() : undefined,
          nextPageStream,
          newStreams,
          sleep,
        }
      } catch (err) {
        if (
          ![504, 502, 500].includes(err.statusCode) ||
          retryCount === DiscordIntegrationService.ENDPOINT_MAX_RETRY - 1
        ) {
          context.logger.error(err, `Error while processing a stream!`)
          throw err
        } else {
          context.logger.error(
            err,
            `Error while processing a stream (retry #${retryCount + 1} out of ${
              DiscordIntegrationService.ENDPOINT_MAX_RETRY
            })`,
          )

          await timeout(2000)
        }
      }
    }
    return Promise.resolve(undefined)
  }

  async isProcessingFinished(
    context: IStepContext,
    currentStream: IIntegrationStream,
    lastOperations: IStreamResultOperation[],
    lastRecord?: any,
    lastRecordTimestamp?: number,
  ): Promise<boolean> {
    if (lastRecordTimestamp === undefined) return false

    switch (currentStream.value) {
      case 'members':
        return IntegrationServiceBase.isRetrospectOver(
          lastRecordTimestamp,
          context.startTimestamp,
          DiscordIntegrationService.MAX_RETROSPECT,
        )

      default:
        if (DiscordIntegrationService.isNew(currentStream.metadata.id, context)) return false

        return IntegrationServiceBase.isRetrospectOver(
          lastRecordTimestamp,
          context.startTimestamp,
          DiscordIntegrationService.MAX_RETROSPECT,
        )
    }
  }

  async postprocess(context: IStepContext): Promise<void> {
    context.integration.settings.channels = context.pipelineData.channels.map((c) => ({
      id: c.id,
      name: c.name,
    }))
  }

  async parseActivities(
    stream: IIntegrationStream,
    context: IStepContext,
    records: DiscordApiMessage[] | DiscordApiMember[],
  ): Promise<DiscordStreamProcessResult> {
    switch (stream.value) {
      case 'members':
        return DiscordIntegrationService.parseMembers(context, records as DiscordApiMember[])
      default:
        return DiscordIntegrationService.parseMessages(context, records as DiscordApiMessage[])
    }
  }

  public static async parseWebhookMember(
    payload: any,
    context: IStepContext,
  ): Promise<AddActivitiesSingle | undefined> {
    const discordMember = await getMember(
      payload.guildId,
      payload.userId,
      DiscordIntegrationService.getToken(context),
      context.logger,
    )

    if (!discordMember.user.bot) {
      const results = await DiscordIntegrationService.parseMembers(context, [discordMember])
      if (results.activities.length > 0) return results.activities[0]
    }

    return undefined
  }

  public static async parseMembers(
    context: IStepContext,
    records: DiscordApiMember[],
  ): Promise<DiscordStreamProcessResult> {
    // We only need the members if they are not bots
    const activities: AddActivitiesSingle[] = records.reduce((acc, record) => {
      if (!record.user.bot) {
        let avatarUrl: string | boolean = false

        if (record.user.avatar !== null && record.user.avatar !== undefined) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${record.user.id}/${record.user.avatar}.png`
        }

        const joinedAt = moment(record.joined_at).utc().toDate()
        const sourceId = `gen-${record.user.id}-${joinedAt.toISOString()}`

        let username = record.user.username

        if (username === 'Deleted User') {
          username = `${username}:${generateUUIDv1()}`
        }

        acc.push({
          tenant: context.integration.tenantId,
          platform: PlatformType.DISCORD,
          type: 'joined_guild',
          sourceId,
          timestamp: joinedAt,
          username,
          member: {
            username: {
              [PlatformType.DISCORD]: {
                username,
                integrationId: context.integration.id,
                sourceId: record.user.id,
              },
            },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.DISCORD]: record.user.id,
              },
              ...(avatarUrl && {
                [MemberAttributeName.AVATAR_URL]: {
                  [PlatformType.DISCORD]: avatarUrl,
                },
              }),
            },
          },
          score: DISCORD_GRID[DiscordActivityType.JOINED_GUILD].score,
          isContribution: DISCORD_GRID[DiscordActivityType.JOINED_GUILD].isContribution,
        })
      }
      return acc
    }, [])

    return {
      activities,
      newStreams: [],
    }
  }

  public static async parseWebhookMessage(
    payload: any,
    context: IStepContext,
  ): Promise<AddActivitiesSingle | undefined> {
    const message = await getMessage(
      payload.channelId,
      payload.id,
      DiscordIntegrationService.getToken(context),
      context.logger,
    )

    const results = await DiscordIntegrationService.parseMessages(context, [message])

    if (results.activities.length > 0) return results.activities[0]

    return undefined
  }

  public static async parseMessages(
    context: IStepContext,
    records: DiscordApiMessage[],
  ): Promise<DiscordStreamProcessResult> {
    const newStreams: IPendingStream[] = []
    const activities: AddActivitiesSingle[] = []

    for (const record of records) {
      let parent: string | undefined
      let parentChannel: string | undefined

      let firstThreadMessage = false
      // is the message starting a thread? if so we should get thread messages as well
      if (record.thread) {
        newStreams.push({
          value: 'channel',
          metadata: {
            id: record.thread.id,
          },
        })

        firstThreadMessage = true
        await DiscordIntegrationService.cacheChannel(record.thread as DiscordApiChannel, context)
      }

      if (record.id === record.channel_id) {
        firstThreadMessage = true
      }

      const channel = await DiscordIntegrationService.getChannel(record.channel_id, context)

      let isForum = false
      const isThread = DiscordIntegrationService.isThread(channel)

      // if we're parsing a thread, mark each message as a child of this thread
      if (isThread || isForum) {
        if (!firstThreadMessage) {
          parent = channel.id
        }

        if (channel.parent_id) {
          const parentChannelObj = await DiscordIntegrationService.getChannel(
            channel.parent_id,
            context,
          )
          parentChannel = parentChannelObj.name
          isForum = DiscordIntegrationService.isForum(parentChannelObj)
        }
      }
      // record.parentId means that it's a reply
      else if (record.message_reference && record.message_reference.message_id) {
        parent = record.message_reference.message_id
      }

      let avatarUrl: string | boolean = false
      if (record.author.avatar !== null && record.author.avatar !== undefined) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${record.author.id}/${record.author.avatar}.png`
      }

      if (!record.author.bot && [MessageType.Default, MessageType.Reply].includes(record.type)) {
        let username = record.author.username

        if (username === 'Deleted User') {
          username = `${username}:${generateUUIDv1()}`
        }

        const activityObject = {
          tenant: context.integration.tenantId,
          platform: PlatformType.DISCORD,
          type: isForum && record.id === parent ? 'thread_started' : 'message',
          sourceId: record.id,
          sourceParentId: parent,
          timestamp: moment(record.timestamp).utc().toDate(),
          title: isThread || isForum ? channel.name : undefined,
          body: record.content
            ? DiscordIntegrationService.replaceMentions(record.content, record.mentions)
            : '',
          url: `https://discordapp.com/channels/${channel.guild_id}/${channel.id}/${record.id}`,
          channel: parentChannel || channel.name,
          attributes: {
            childChannel: parentChannel ? channel.name : undefined,
            thread: isThread,
            reactions: record.reactions ? record.reactions : [],
            attachments: record.attachments ? record.attachments : [],
            forum: isForum,
          },
          username,
          member: {
            username: {
              [PlatformType.DISCORD]: {
                username,
                integrationId: context.integration.id,
              },
            },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.DISCORD]: record.author.id,
              },
              ...(avatarUrl && {
                [MemberAttributeName.AVATAR_URL]: {
                  [PlatformType.DISCORD]: avatarUrl,
                },
              }),
              // Add isBot attribute for deleted users to exclude from search. Add if username contains Deleted User
              ...(username.includes('Deleted User') && {
                [MemberAttributeName.IS_BOT]: {
                  [PlatformType.DISCORD]: true,
                },
              }),
            },
          },
          score: DISCORD_GRID[DiscordActivityType.MESSAGE].score,
          isContribution: DISCORD_GRID[DiscordActivityType.MESSAGE].isContribution,
        } as any

        activities.push(activityObject)
      }
    }

    return {
      activities,
      newStreams,
    }
  }

  /**
   * Parse mentions
   * @param text Message text
   * @param mentions
   * @returns Message text, swapping mention IDs by mentions
   */
  private static replaceMentions(text: string, mentions: DiscordApiUser[] | undefined): string {
    if (mentions === undefined) return text

    // Replace <@!123456789> by @username
    text = text.replace(/<@!(\d+)>/g, (match, id) => {
      const mention = mentions.find((m) => m.id === id)
      return mention ? `@${mention.username}` : match
    })
    // Replace <@123456789> by @username
    text = text.replace(/<@(\d+)>/g, (match, id) => {
      const mention = mentions.find((m) => m.id === id)
      return mention ? `@${mention.username}` : match
    })

    return text
  }

  /**
   * Get the Superface usecase for the given endpoint with its main argument
   * @param stream The endpoint we are currently targeting
   * @param guildId The ID of the profile we are getting data for
   * @returns The function to call, as well as its main argument
   */
  private static getUsecase(
    stream: IIntegrationStream,
    guildId: string,
  ): {
    fn: Function
    arg: any
  } {
    switch (stream.value) {
      case 'members':
        return { fn: getMembers, arg: { guildId } }
      case 'channel':
        return { fn: getMessages, arg: { channelId: stream.metadata.id } }
      default:
        throw new Error(`Unknown stream ${stream.value}!`)
    }
  }

  private static async cacheChannel(
    channel: DiscordApiChannel,
    context: IStepContext,
  ): Promise<void> {
    if (!context.pipelineData.channelCache) {
      const redis = await getRedisClient(REDIS_CONFIG, true)
      context.pipelineData.channelCache = new RedisCache('discord-channels', redis, context.logger)
    }

    const cache = context.pipelineData.channelCache as RedisCache

    await cache.set(channel.id, JSON.stringify(channel), 24 * 60 * 60)
  }

  private static async getChannel(id: string, context: IStepContext): Promise<DiscordApiChannel> {
    if (!context.pipelineData.channelCache) {
      const redis = await getRedisClient(REDIS_CONFIG, true)
      context.pipelineData.channelCache = new RedisCache('discord-channels', redis, context.logger)
    }

    const cache = context.pipelineData.channelCache as RedisCache

    const cached = await cache.get(id)

    if (cached) {
      return JSON.parse(cached)
    }

    const channel = await getChannel(
      id,
      DiscordIntegrationService.getToken(context),
      context.logger,
    )
    await cache.set(id, JSON.stringify(channel), 24 * 60 * 60)

    return channel
  }

  private static isForum(channel: DiscordApiChannel): boolean {
    return channel.type === ChannelType.GuildForum
  }

  private static isThread(channel: DiscordApiChannel): boolean {
    return channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread
  }

  private static isNew(channelId: string, context: IStepContext): boolean {
    const settingsChannel = context.integration.settings.channels || []
    return settingsChannel.find((c) => c.id === channelId) === undefined
  }
}
