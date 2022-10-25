import moment from 'moment/moment'
import sanitizeHtml from 'sanitize-html'
import { SLACK_CONFIG } from '../../../../config'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
  IStreamResultOperation,
} from '../../../../types/integration/stepResult'
import { IntegrationType, PlatformType } from '../../../../types/integrationEnums'
import { IntegrationServiceBase } from '../integrationServiceBase'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import { SlackMemberAttributes } from '../../../../database/attributes/member/slack'
import { Channels } from '../../types/regularTypes'
import getChannels from '../../usecases/chat/getChannels'
import { Thread } from '../../types/iteratorTypes'
import getMembers from '../../usecases/chat/getMembers'
import getMessagesThreads from '../../usecases/chat/getMessagesThreads'
import getMessages from '../../usecases/chat/getMessages'
import { timeout } from '../../../../utils/timing'
import { AddActivitiesSingle } from '../../types/messageTypes'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { SlackGrid } from '../../grid/slackGrid'
import IntegrationRepository from '../../../../database/repositories/integrationRepository'
import Operations from '../../../dbOperations/operations'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable no-case-declarations */

export class SlackIntegrationService extends IntegrationServiceBase {
  static maxRetrospect: number = SLACK_CONFIG.maxRetrospectInSeconds || 3600

  constructor() {
    super(IntegrationType.SLACK, 20)

    this.globalLimit = SLACK_CONFIG.globalLimit || 0
  }

  async preprocess(context: IStepContext): Promise<void> {
    const superface = IntegrationServiceBase.superfaceClient()

    let channelsFromSlackAPI: Channels = await getChannels(
      superface,
      PlatformType.SLACK,
      { types: ['public'] },
      context.integration.token,
    )

    const channels = context.integration.settings.channels
      ? context.integration.settings.channels
      : []

    channelsFromSlackAPI = channelsFromSlackAPI.map((c) => {
      if (channels.filter((a) => a.id === c.id).length <= 0) {
        return { ...c, new: true }
      }
      return c
    })

    const members = context.integration.settings.members ? context.integration.settings.members : {}

    context.pipelineData = {
      superface,
      members,
      channels: channelsFromSlackAPI,
      channelsInfo: channelsFromSlackAPI.reduce((acc, channel) => {
        acc[channel.id] = {
          name: channel.name,
          new: !!channel.new,
        }
        return acc
      }, {}),
    }
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.repoContext)
    await service.createPredefined(SlackMemberAttributes)
  }

  async getStreams(context: IStepContext): Promise<IIntegrationStream[]> {
    return context.pipelineData.channels
      .map((c) => c.id)
      .concat(['members'])
      .map((c) => ({
        value: c,
        metadata: { page: '' },
      }))
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    await timeout(1000)
    const { fn, arg } = SlackIntegrationService.getSuperfaceUsecase(stream)

    const { records, nextPage, limit, timeUntilReset } = await fn(
      context.pipelineData.superface,
      PlatformType.SLACK,
      context.integration.token,
      arg,
      stream.metadata.page,
      200,
    )

    const newStreams: IIntegrationStream[] = nextPage
      ? [{ value: stream.value, metadata: { ...(stream.metadata || {}), page: nextPage } }]
      : []
    const sleep = limit <= 1 ? timeUntilReset : undefined

    if (records.length === 0) {
      return {
        operations: [],
        newStreams,
        sleep,
      }
    }

    const { activities, additionalStreams } = await SlackIntegrationService.parseActivities(
      records,
      stream,
      context,
    )

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
      newStreams: newStreams.concat(additionalStreams),
      sleep,
    }
  }

  async postprocess(
    context: IStepContext,
    failedStreams?: IIntegrationStream[],
    remainingStreams?: IIntegrationStream[],
  ): Promise<void> {
    // Strip the new property from channels
    context.integration.settings.channels = context.pipelineData.channels.map((ch) => {
      const { new: _, ...raw } = ch
      return raw
    })
  }

  private static async parseActivities(
    records: any[],
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<{ activities: AddActivitiesSingle[]; additionalStreams: IIntegrationStream[] }> {
    switch (stream.value) {
      case 'members':
        const parseMembersResult = await this.parseMembers(records, context)

        return {
          activities: parseMembersResult.activities,
          additionalStreams: parseMembersResult.additionalStreams,
        }

      case 'threads':
        const parseMessagesInThreadsResult = this.parseMessagesInThreads(records, stream, context)
        return {
          activities: parseMessagesInThreadsResult.activities,
          additionalStreams: parseMessagesInThreadsResult.additionalStreams,
        }
      default:
        const parseMessagesResult = this.parseMessages(records, stream, context)
        return {
          activities: parseMessagesResult.activities,
          additionalStreams: parseMessagesResult.additionalStreams,
        }
    }
  }

  /**
   * Map the messages coming from Slack to activities and members
   * @param records List of records coming from the API
   * @param stream
   * @param context
   * @returns List of activities and members
   */
  private static parseMessages(
    records: Array<any>,
    stream: IIntegrationStream,
    context: IStepContext,
  ): { activities: AddActivitiesSingle[]; additionalStreams: IIntegrationStream[] } {
    const newStreams: IIntegrationStream[] = []

    const activities = records.reduce((acc, record) => {
      if (!record.isBot && context.pipelineData.members[record.author?.id]) {
        const body = record.text
          ? SlackIntegrationService.removeMentions(record.text, context.pipelineData)
          : ''
        acc.push({
          tenant: context.integration.tenantId,
          platform: PlatformType.SLACK,
          type: 'message',
          sourceId: record.id,
          sourceParentId: '',
          timestamp: moment(record.createdAt).utc().toDate(),
          body,
          url: record.url ? record.url : '',
          channel: context.pipelineData.channelsInfo[stream.value].name,
          attributes: {
            thread: false,
            reactions: record.reactions ? record.reactions : [],
            attachments: record.attachments ? record.attachments : [],
          },
          member: {
            username: context.pipelineData.members[record.author.id],
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.SLACK]: record.author.id,
              },
            },
          },
          score: SlackGrid.message.score,
          isKeyAction: SlackGrid.message.isKeyAction,
        })

        if (record.hasThread) {
          newStreams.push({
            value: 'threads',
            metadata: {
              page: '',
              threadId: record.threadId,
              channel: context.pipelineData.channelsInfo[stream.value].name,
              channelId: stream.value,
              placeholder: body,
              new: context.pipelineData.channelsInfo[stream.value].new,
            },
          })
        }
      }
      return acc
    }, [])

    return {
      activities,
      additionalStreams: newStreams,
    }
  }

  /**
   * Map the messages coming from Slack to activities and members records to the format of the message to add activities and members
   * @param records List of records coming from the API
   * @param stream
   * @param context
   * @returns List of activities and members
   */
  private static parseMessagesInThreads(
    records: any[],
    stream: IIntegrationStream,
    context: IStepContext,
  ): { activities: AddActivitiesSingle[]; additionalStreams: IIntegrationStream[] } {
    const threadInfo = stream.metadata
    const activities = records.reduce((acc, record) => {
      if (!record.isBot && context.pipelineData.members[record.author.id]) {
        const body = record.text
          ? SlackIntegrationService.removeMentions(record.text, context.pipelineData)
          : ''
        acc.push({
          tenant: context.integration.tenantId,
          platform: PlatformType.SLACK,
          type: 'message',
          sourceId: record.id,
          sourceParentId: threadInfo.threadId,
          timestamp: moment.unix(record.createdAt).utc().toDate(),
          body,
          url: record.url ? record.url : '',
          channel: threadInfo.channel,
          attributes: {
            thread: {
              body: sanitizeHtml(threadInfo.placeholder),
              id: threadInfo.threadId,
            },
            reactions: record.reactions ? record.reactions : [],
            attachments: record.attachments ? record.attachments : [],
          },
          member: {
            username: context.pipelineData.members[record.author.id],
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.SLACK]: record.author.id,
              },
            },
          },
          score: SlackGrid.message.score,
          isKeyAction: SlackGrid.message.isKeyAction,
        })
      }
      return acc
    }, [])

    return {
      activities,
      additionalStreams: [],
    }
  }

  /**
   * Parse mentions
   * @param text Message text
   * @param pipelineData
   * @returns Message text, swapping mention IDs by mentions
   */
  private static removeMentions(text: string, pipelineData?: any): string {
    const regex = /<@!?[^>]*>/
    const globalRegex = /<@!?[^>]*>/g
    const matches = text.match(globalRegex)
    if (matches) {
      for (let match of matches) {
        match = match.replace('<', '').replace('>', '').replace('@', '').replace('!', '')
        text = text.replace(regex, `@${pipelineData.members[match] || 'mention'}`)
      }
    }

    return text
  }

  /**
   * Map the members records to the format of the message to add activities and members
   * @param records List of records coming from the API
   * @param context
   * @returns List of activities and members
   */
  private static async parseMembers(
    records: any[],
    context: IStepContext,
  ): Promise<{ activities: AddActivitiesSingle[]; additionalStreams: IIntegrationStream[] }> {
    // We only need the members if they are not bots
    const activities = records.reduce((acc, record) => {
      if (
        !(
          record.isBot ||
          record.username === 'Slackbot' ||
          record.id in context.pipelineData.members
        )
      ) {
        context.pipelineData.members[record.id] = record.username
        acc.push({
          tenant: context.integration.tenantId,
          platform: PlatformType.SLACK,
          type: 'channel_joined',
          sourceId: record.id,
          timestamp: context.onboarding
            ? moment('1970-01-01T00:00:00+00:00').utc().toDate()
            : moment().utc().toDate(),
          member: {
            username: record.username,
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.SLACK]: record.id,
              },
            },
          },
          score: SlackGrid.join.score,
          isKeyAction: SlackGrid.join.isKeyAction,
        })
      }
      return acc
    }, [])

    // Call the updateMembers. This needs to happen synchronously every time
    await this.updateMembers(context)
    return {
      activities,
      additionalStreams: [],
    }
  }

  /**
   * Update members for an integration.
   * This update needs to happen synchronously, since the message endpoints need these members
   */
  private static async updateMembers(context: IStepContext) {
    const integration = await IntegrationRepository.findById(
      context.integration.id,
      context.repoContext,
    )
    const settings = {
      members: context.pipelineData.members,
      channels: integration.settings.channels || [],
    }
    await IntegrationRepository.update(context.integration.id, { settings }, context.repoContext)
  }

  async isProcessingFinished(
    context: IStepContext,
    currentStream: IIntegrationStream,
    lastOperations: IStreamResultOperation[],
    lastRecord?: any,
    lastRecordTimestamp?: number,
  ): Promise<boolean> {
    switch (currentStream.value) {
      case 'members':
        return lastRecord.sourceId in context.pipelineData.members
      case 'threads':
        if ((currentStream.metadata as Thread).new) {
          return false
        }

        if (lastRecordTimestamp === undefined) return true

        return IntegrationServiceBase.isRetrospectOver(
          lastRecordTimestamp,
          context.startTimestamp,
          SlackIntegrationService.maxRetrospect,
        )

      default:
        if (context.pipelineData.channelsInfo[currentStream.value].new) {
          return false
        }

        if (lastRecordTimestamp === undefined) return true

        return IntegrationServiceBase.isRetrospectOver(
          lastRecordTimestamp,
          context.startTimestamp,
          SlackIntegrationService.maxRetrospect,
        )
    }
  }

  /**
   * Get the Superface usecase for the given endpoint with its main argument
   * @param stream The stream we are currently targeting
   * @returns The function to call, as well as its main argument
   */
  private static getSuperfaceUsecase(stream: IIntegrationStream): {
    fn: Function
    arg: any
  } {
    switch (stream.value) {
      case 'members':
        return { fn: getMembers, arg: stream.value }
      case 'threads':
        return { fn: getMessagesThreads, arg: stream }
      default:
        return { fn: getMessages, arg: stream.value }
    }
  }
}
