import moment from 'moment/moment'
import lodash from 'lodash'
import {
  DiscordMessages,
  DiscordMembers,
  DiscordMention,
  DiscordStreamProcessResult,
} from '../../types/discordTypes'
import { DISCORD_CONFIG } from '../../../../config'
import { DiscordMemberAttributes } from '../../../../database/attributes/member/discord'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
  IStreamResultOperation,
} from '../../../../types/integration/stepResult'
import { IntegrationType, PlatformType } from '../../../../types/integrationEnums'
import { timeout } from '../../../../utils/timing'
import Operations from '../../../dbOperations/operations'
import { DiscordGrid } from '../../grid/discordGrid'
import { Channels } from '../../types/regularTypes'
import getChannels from '../../usecases/discord/getChannels'
import getMembers from '../../usecases/discord/getMembers'
import getMessages from '../../usecases/discord/getMessages'
import { IntegrationServiceBase } from '../integrationServiceBase'
import { sendNodeWorkerMessage } from '../../../utils/nodeWorkerSQS'
import { NodeWorkerIntegrationProcessMessage } from '../../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { AddActivitiesSingle } from '../../types/messageTypes'
import { singleOrDefault } from '../../../../utils/arrays'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class DiscordIntegrationService extends IntegrationServiceBase {
  static readonly ENDPOINT_MAX_RETRY = 5

  static readonly MAX_RETROSPECT = DISCORD_CONFIG.maxRetrospectInSeconds || 3600

  public token: string

  constructor() {
    super(IntegrationType.DISCORD, 60)

    this.globalLimit = DISCORD_CONFIG.globalLimit || 0
    this.limitResetFrequencySeconds = (DISCORD_CONFIG.limitResetFrequencyDays || 0) * 24 * 60 * 60

    this.token = `Bot ${DISCORD_CONFIG.token}`
  }

  private getToken(context: IStepContext): string {
    if (context.integration.token) {
      return `Bot ${context.integration.token}`
    }

    return this.token
  }

  override async triggerIntegrationCheck(integrations: any[]): Promise<void> {
    let initialDelaySeconds = 0
    const batches = lodash.chunk(integrations, 2)

    for (const batch of batches) {
      for (const integration of batch) {
        await sendNodeWorkerMessage(
          integration.tenantId,
          new NodeWorkerIntegrationProcessMessage(
            this.type,
            integration.tenantId,
            false,
            integration.id,
          ),
          initialDelaySeconds,
        )
      }

      initialDelaySeconds += 120
    }
  }

  async preprocess(context: IStepContext): Promise<void> {
    const guildId = context.integration.integrationIdentifier

    let channelsFromDiscordAPI: Channels = await getChannels(
      {
        guildId,
        token: this.getToken(context),
      },
      this.logger(context),
    )

    const channels = context.integration.settings.channels
      ? context.integration.settings.channels
      : []

    // Add bool new property to new channels
    channelsFromDiscordAPI = channelsFromDiscordAPI.map((c) => {
      if (channels.filter((a) => a.id === c.id).length <= 0) {
        return { ...c, new: true }
      }
      return c
    })

    context.pipelineData = {
      settingsChannels: channels,
      channels: channelsFromDiscordAPI,
      channelsInfo: channelsFromDiscordAPI.reduce((acc, channel) => {
        acc[channel.id] = {
          name: channel.name,
          new: !!channel.new,
        }
        return acc
      }, {}),
      guildId: context.integration.integrationIdentifier,
    }
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.serviceContext)
    await service.createPredefined(DiscordMemberAttributes)
  }

  async getStreams(context: IStepContext): Promise<IIntegrationStream[]> {
    const predefined: IIntegrationStream[] = [
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
    const logger = this.logger(context)

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
            token: this.getToken(context),
            page: stream.metadata.page,
            perPage: 100,
          },
          logger,
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

        const { activities, newStreams } = this.parseActivities(stream, context, records)

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
          logger.error(err, `Error while processing a stream!`)
          throw err
        } else {
          logger.error(
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
        if (context.pipelineData.channelsInfo[currentStream.metadata.id].new) return false

        return IntegrationServiceBase.isRetrospectOver(
          lastRecordTimestamp,
          context.startTimestamp,
          DiscordIntegrationService.MAX_RETROSPECT,
        )
    }
  }

  async postprocess(
    context: IStepContext,
    failedStreams?: IIntegrationStream[],
    remainingStreams?: IIntegrationStream[],
  ): Promise<void> {
    context.integration.settings.channels = context.pipelineData.channels.map((ch) => {
      const { new: _, ...raw } = ch
      return raw
    })
  }

  parseActivities(
    stream: IIntegrationStream,
    context: IStepContext,
    records: DiscordMessages | DiscordMembers,
  ): DiscordStreamProcessResult {
    switch (stream.value) {
      case 'members':
        return this.parseMembers(context, records as DiscordMembers)
      default:
        return this.parseMessages(context, records as DiscordMessages, stream)
    }
  }

  parseMembers(context: IStepContext, records: Array<any>): DiscordStreamProcessResult {
    // We only need the members if they are not bots
    const activities: AddActivitiesSingle[] = records.reduce((acc, record) => {
      if (!record.user.bot) {
        let avatarUrl: string | boolean = false

        if (record.user.avatar !== null && record.user.avatar !== undefined) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${record.user.id}/${record.user.avatar}.png`
        }
        acc.push({
          tenant: context.integration.tenantId,
          platform: PlatformType.DISCORD,
          type: 'joined_guild',
          sourceId: IntegrationServiceBase.generateSourceIdHash(
            record.id,
            'joined_guild',
            moment(record.joined_at).utc().unix().toString(),
            PlatformType.DISCORD,
          ),
          timestamp: moment(record.joined_at).utc().toDate(),
          member: {
            username: record.user.username,
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.DISCORD]: record.id,
              },
              ...(avatarUrl && {
                [MemberAttributeName.AVATAR_URL]: {
                  [PlatformType.DISCORD]: avatarUrl,
                },
              }),
            },
          },
          score: DiscordGrid.join.score,
          isKeyAction: DiscordGrid.join.isKeyAction,
        })
      }
      return acc
    }, [])

    return {
      activities,
      newStreams: [],
    }
  }

  parseMessages(
    context: IStepContext,
    records: DiscordMessages,
    stream: IIntegrationStream,
  ): DiscordStreamProcessResult {
    const newStreams: IIntegrationStream[] = []
    const activities: AddActivitiesSingle[] = records.reduce((acc, record) => {
      let parent = ''

      const channelInfo = context.pipelineData.channelsInfo[stream.metadata.id]

      // is the message starting a thread?
      if (record.thread) {
        parent = record.thread.id
        newStreams.push({
          value: 'thread',
          metadata: {
            id: record.thread.id,
          },
        })

        context.pipelineData.channelsInfo[record.thread.id] = {
          name: context.pipelineData.channelsInfo[record.channel_id].name,
          new:
            singleOrDefault(
              context.pipelineData.settingsChannels,
              (c) => c.id === record.thread.id,
            ) === undefined,
        }
      }
      // if we're parsing a thread, mark each message as a child of this thread
      else if (stream.value === 'thread') {
        parent = stream.metadata.id
      }
      // record.parentId means that it's a reply
      else if (record.message_reference && record.message_reference.message_id) {
        parent = record.message_reference.message_id
      }

      let avatarUrl: string | boolean = false
      if (record.author.avatar !== null && record.author.avatar !== undefined) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${record.author.id}/${record.author.avatar}.png`
      }

      if (!record.author.bot) {
        const activityObject = {
          tenant: context.integration.tenantId,
          platform: PlatformType.DISCORD,
          type: 'message',
          sourceId: record.id,
          sourceParentId: parent,
          timestamp: moment(record.timestamp).utc().toDate(),
          body: record.content
            ? DiscordIntegrationService.replaceMentions(record.content, record.mentions)
            : '',
          url: `https://discordapp.com/channels/${context.pipelineData.guildId}/${stream.metadata.id}/${record.id}`,
          channel: channelInfo.name,
          attributes: {
            thread: record.thread !== undefined || stream.value === 'thread',
            reactions: record.reactions ? record.reactions : [],
            attachments: record.attachments ? record.attachments : [],
          },
          member: {
            username: record.author.username,
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.DISCORD]: record.author.id,
              },
              ...(avatarUrl && {
                [MemberAttributeName.AVATAR_URL]: {
                  [PlatformType.DISCORD]: avatarUrl,
                },
              }),
            },
          },
          score: DiscordGrid.message.score,
          isKeyAction: DiscordGrid.message.isKeyAction,
        } as any

        acc.push(activityObject)
      }
      return acc
    }, [])

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
  private static replaceMentions(text: string, mentions: [DiscordMention] | undefined): string {
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
      case 'thread':
        return { fn: getMessages, arg: { channelId: stream.metadata.id } }
      default:
        throw new Error(`Unknown stream ${stream.value}!`)
    }
  }
}
