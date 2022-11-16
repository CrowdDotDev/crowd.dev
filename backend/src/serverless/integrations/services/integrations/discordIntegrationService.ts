import moment from 'moment/moment'
import { DiscordMessages, DiscordMembers, DiscordMention } from '../../types/discordTypes'
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
import { AddActivitiesSingle } from '../../types/messageTypes'
import { Channels } from '../../types/regularTypes'
import getChannels from '../../usecases/discord/getChannels'
import getMembers from '../../usecases/discord/getMembers'
import getMessages from '../../usecases/discord/getMessages'
import getThreads from '../../usecases/discord/getThreads'
import { IntegrationServiceBase } from '../integrationServiceBase'
import { sendNodeWorkerMessage } from '../../../utils/nodeWorkerSQS'
import { NodeWorkerIntegrationProcessMessage } from '../../../../types/mq/nodeWorkerIntegrationProcessMessage'

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

  override async triggerIntegrationCheck(integrations: any[]): Promise<void> {
    let initialDelaySeconds = 0
    for (const integration of integrations) {
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

      initialDelaySeconds += 120
    }
  }

  async preprocess(context: IStepContext): Promise<void> {
    const guildId = context.integration.integrationIdentifier

    const threads: Channels = await getThreads(
      {
        guildId,
        token: this.token,
      },
      this.logger(context),
    )
    let channelsFromDiscordAPI: Channels = await getChannels(
      {
        guildId,
        token: this.token,
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

    const channelsWithThreads = channelsFromDiscordAPI.concat(threads)

    context.pipelineData = {
      channelsFromDiscordAPI,
      channels: channelsWithThreads,
      channelsInfo: channelsWithThreads.reduce((acc, channel) => {
        acc[channel.id] = {
          name: channel.name,
          thread: !!channel.thread,
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
        value: c.id,
        metadata: {
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
          stream.value,
          context.pipelineData.guildId,
        )
        const { records, nextPage, limit, timeUntilReset } = await fn(
          {
            ...arg,
            token: this.token,
            page: stream.metadata.page,
            perPage: 100,
          },
          logger,
        )

        const nextPageStream = nextPage
          ? { value: stream.value, metadata: { page: nextPage } }
          : undefined

        const sleep = limit <= 1 ? timeUntilReset : undefined

        if (records.length === 0) {
          return {
            operations: [],
            nextPageStream,
            sleep,
          }
        }

        const activities = this.parseActivities(stream, context, records)

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
        if (context.pipelineData.channelsInfo[currentStream.value].new) return false

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
    context.integration.settings.channels = context.pipelineData.channelsFromDiscordAPI.map(
      (ch) => {
        const { new: _, ...raw } = ch
        return raw
      },
    )
  }

  parseActivities(
    stream: IIntegrationStream,
    context: IStepContext,
    records: DiscordMessages | DiscordMembers,
  ): AddActivitiesSingle[] {
    switch (stream.value) {
      case 'members':
        return this.parseMembers(context.integration.tenantId, records as DiscordMembers)
      default:
        return this.parseMessages(
          context.pipelineData.guildId,
          context.integration.tenantId,
          context.pipelineData.channelsInfo,
          records as DiscordMessages,
          stream,
        )
    }
  }

  parseMembers(tenantId: string, records: Array<any>): Array<AddActivitiesSingle> {
    // We only need the members if they are not bots
    return records.reduce((acc, record) => {
      if (!record.user.bot) {
        let avatarUrl: string | boolean = false

        if (record.user.avatar !== null && record.user.avatar !== undefined) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${record.user.id}/${record.user.avatar}.png`
        }
        acc.push({
          tenant: tenantId,
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
  }

  parseMessages(
    guildId: string,
    tenantId: string,
    channelsInfo: any,
    records: DiscordMessages,
    stream: IIntegrationStream,
  ): Array<AddActivitiesSingle> {
    return records.reduce((acc, record) => {
      let parent = ''

      // if we're parsing a thread, mark each message as a child
      const channelInfo = channelsInfo[stream.value]
      if (channelInfo.thread) {
        parent = stream.value
      }

      // record.parentId means that it's a reply
      if (record.message_reference && record.message_reference.message_id) {
        parent = record.message_reference.message_id
      }

      let avatarUrl: string | boolean = false
      if (record.author.avatar !== null && record.author.avatar !== undefined) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${record.author.id}/${record.author.avatar}.png`
      }

      if (!record.author.bot) {
        const activityObject = {
          tenant: tenantId,
          platform: PlatformType.DISCORD,
          type: 'message',
          sourceId: record.id,
          sourceParentId: parent,
          timestamp: moment(record.timestamp).utc().toDate(),
          body: record.content
            ? DiscordIntegrationService.replaceMentions(record.content, record.mentions)
            : '',
          url: `https://discordapp.com/channels/${guildId}/${stream.value}/${record.id}`,
          channel: channelInfo.name,
          attributes: {
            thread: channelInfo.thread ? channelInfo.name : false,
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
  }

  /**
   * Parse mentions
   * @param text Message text
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
    stream: string,
    guildId: string,
  ): {
    fn: Function
    arg: any
  } {
    switch (stream) {
      case 'members':
        return { fn: getMembers, arg: { guildId } }
      default:
        return { fn: getMessages, arg: { channelId: stream } }
    }
  }
}
