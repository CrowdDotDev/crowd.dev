import moment from 'moment/moment'
import { IntegrationServiceBase } from '../integrationServiceBase'
import { IntegrationType, PlatformType } from '../../../../types/integrationEnums'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import { DiscordMemberAttributes } from '../../../../database/attributes/member/discord'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
  IStreamResultOperation,
} from '../../../../types/integration/stepResult'
import getThreads from '../../usecases/chat/getThreads'
import { DISCORD_CONFIG } from '../../../../config'
import getChannels from '../../usecases/chat/getChannels'
import { Channels } from '../../types/regularTypes'
import getMembers from '../../usecases/chat/getMembers'
import getMessages from '../../usecases/chat/getMessages'
import { createChildLogger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'
import { AddActivitiesSingle } from '../../types/messageTypes'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { DiscordGrid } from '../../grid/discordGrid'
import Operations from '../../../dbOperations/operations'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class DiscordIntegrationService extends IntegrationServiceBase {
  static readonly ENDPOINT_MAX_RETRY = 5

  static readonly MAX_RETROSPECT = DISCORD_CONFIG.maxRetrospectInSeconds || 3600

  constructor() {
    super(IntegrationType.DISCORD, 20)

    this.globalLimit = DISCORD_CONFIG.globalLimit || 0
    this.limitResetFrequencySeconds = (DISCORD_CONFIG.limitResetFrequencyDays || 0) * 24 * 60 * 60
  }

  async preprocess(context: IStepContext): Promise<void> {
    const guildId = context.integration.integrationIdentifier
    const superface = IntegrationServiceBase.superfaceClient()

    const threads: Channels = await getThreads(superface, guildId, DISCORD_CONFIG.token)
    let channelsFromDiscordAPI: Channels = await getChannels(
      superface,
      PlatformType.DISCORD,
      {
        server: guildId,
      },
      DISCORD_CONFIG.token,
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
      superface: IntegrationServiceBase.superfaceClient(),
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
    const logger = createChildLogger('processStream', context.serviceContext.log, { stream })

    // sleep for 2 seconds for rate limit
    await timeout(2000)
    for (
      let retryCount = 0;
      retryCount < DiscordIntegrationService.ENDPOINT_MAX_RETRY;
      retryCount++
    ) {
      try {
        const { fn, arg } = DiscordIntegrationService.getSuperfaceUsecase(
          stream.value,
          context.pipelineData.guildId,
        )
        const { records, nextPage, limit, timeUntilReset } = await fn(
          context.pipelineData.superface,
          PlatformType.DISCORD,
          DISCORD_CONFIG.token,
          arg,
          stream.metadata.page,
        )

        const newStreams = nextPage
          ? [{ value: stream.value, metadata: { page: nextPage } }]
          : undefined
        const sleep = limit <= 1 ? timeUntilReset * 1000 : undefined

        if (records.length === 0) {
          return {
            operations: [],
            newStreams,
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
    records: Array<object>,
  ): AddActivitiesSingle[] {
    switch (stream.value) {
      case 'members':
        return this.parseMembers(context.integration.tenantId, records)
      default:
        return this.parseMessages(
          context.pipelineData.guildId,
          context.integration.tenantId,
          context.pipelineData.channelsInfo,
          records,
          stream,
        )
    }
  }

  parseMembers(tenantId: string, records: Array<any>): Array<AddActivitiesSingle> {
    // We only need the members if they are not bots
    return records.reduce((acc, record) => {
      if (!record.isBot) {
        acc.push({
          tenant: tenantId,
          platform: PlatformType.DISCORD,
          type: 'joined_guild',
          sourceId: IntegrationServiceBase.generateSourceIdHash(
            record.id,
            'joined_guild',
            moment(record.joinedAt).utc().unix().toString(),
            PlatformType.DISCORD,
          ),
          timestamp: moment(record.joinedAt).utc().toDate(),
          member: {
            username: record.username,
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.DISCORD]: record.id,
              },
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
    records: Array<any>,
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
      if (record.parentId) {
        parent = record.parentId
      }

      if (!record.isBot) {
        const activityObject = {
          tenant: tenantId,
          platform: PlatformType.DISCORD,
          type: 'message',
          sourceId: record.id,
          sourceParentId: parent,
          timestamp: moment(record.createdAt).utc().toDate(),
          body: record.text ? DiscordIntegrationService.removeMentions(record.text) : '',
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
            },
          },
          score: DiscordGrid.message.score,
          isKeyAction: DiscordGrid.message.isKeyAction,
        } as any

        if (record.hasThread) {
          activityObject.attributes.threadStarter = record.hasThread
        }

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
  private static removeMentions(text: string): string {
    const mentionsText = text.replace(/<@!?[^>]*>/g, '@mention')
    // Replace several occurrences of mentions by one mention
    return mentionsText.replace(/(@mention+\s?){2,}/, '@mentions')
  }

  /**
   * Get the Superface usecase for the given endpoint with its main argument
   * @param stream The endpoint we are currently targeting
   * @param guildId The ID of the profile we are getting data for
   * @returns The function to call, as well as its main argument
   */
  private static getSuperfaceUsecase(
    stream: string,
    guildId: string,
  ): {
    fn: Function
    arg: string
  } {
    switch (stream) {
      case 'members':
        return { fn: getMembers, arg: guildId }
      default:
        return { fn: getMessages, arg: stream }
    }
  }
}
