import moment from 'moment/moment'
import sanitizeHtml from 'sanitize-html'
import { SLACK_GRID, SlackActivityType } from '@crowd/integrations'
import { RedisCache, getRedisClient } from '@crowd/redis'
import { timeout } from '@crowd/common'
import { IntegrationType, PlatformType } from '@crowd/types'
import { SLACK_CONFIG, REDIS_CONFIG } from '../../../../conf'
import {
  IIntegrationStream,
  IPendingStream,
  IProcessStreamResults,
  IStepContext,
  IStreamResultOperation,
} from '../../../../types/integration/stepResult'
import { SlackMessages } from '../../types/slackTypes'
import { IntegrationServiceBase } from '../integrationServiceBase'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import { SlackMemberAttributes } from '../../../../database/attributes/member/slack'
import getChannels from '../../usecases/slack/getChannels'
import { Thread } from '../../types/iteratorTypes'
import getMessagesThreads from '../../usecases/slack/getMessagesInThreads'
import getMessages from '../../usecases/slack/getMessages'
import getTeam from '../../usecases/slack/getTeam'
import { AddActivitiesSingle, Member, PlatformIdentities } from '../../types/messageTypes'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import Operations from '../../../dbOperations/operations'
import getMember from '../../usecases/slack/getMember'
import getMembers from '../../usecases/slack/getMembers'

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
    const redis = await getRedisClient(REDIS_CONFIG, true)
    const membersCache = new RedisCache('slack-members', redis, context.logger)

    let channelsFromSlackAPI = await getChannels(
      { token: context.integration.token },
      context.logger,
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

    const team = await getTeam({ token: context.integration.token }, context.logger)
    const teamUrl = team.url

    context.pipelineData = {
      membersCache,
      channels: channelsFromSlackAPI,
      team,
      teamUrl,
      channelsInfo: channelsFromSlackAPI.reduce((acc, channel) => {
        acc[channel.id] = {
          name: channel.name,
          new: !!(channel as any).new,
        }
        return acc
      }, {}),
    }
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.repoContext)
    await service.createPredefined(SlackMemberAttributes)
  }

  async getStreams(context: IStepContext): Promise<IPendingStream[]> {
    const streams = []

    if (context.onboarding) {
      streams.push({
        value: 'members',
        metadata: { page: '' },
      })
    }

    const channelStreams = context.pipelineData.channels.map((c) => ({
      value: 'channel',
      metadata: { channelId: c.id, page: '', general: c.general },
    }))
    if (channelStreams.length > 0) {
      streams.push(...channelStreams)
    }

    return streams
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    await timeout(1000)

    const operations: IStreamResultOperation[] = []
    let nextPage: string
    let newStreams: IPendingStream[]
    let lastRecord

    switch (stream.value) {
      case 'channel': {
        const result = await getMessages(
          {
            channelId: stream.metadata.channelId,
            page: stream.metadata.page,
            perPage: 200,
            token: context.integration.token,
          },
          context.logger,
        )

        nextPage = result.nextPage

        if (result.records.length > 0) {
          const { activities, additionalStreams } = await this.parseActivities(
            result.records,
            stream,
            context,
          )

          operations.push({
            type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
            records: activities,
          })
          newStreams = additionalStreams
          lastRecord = activities.length > 0 ? activities[activities.length - 1] : undefined
        }

        break
      }
      case 'threads': {
        const result = await getMessagesThreads(
          {
            token: context.integration.token,
            channelId: stream.metadata.channelId,
            page: stream.metadata.page,
            perPage: 200,
            threadId: stream.metadata.threadId,
          },
          context.logger,
        )

        nextPage = result.nextPage

        if (result.records.length > 0) {
          const { activities, additionalStreams } = await this.parseActivities(
            result.records,
            stream,
            context,
          )

          operations.push({
            type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
            records: activities,
          })
          newStreams = additionalStreams
          lastRecord = activities.length > 0 ? activities[activities.length - 1] : undefined
        }
        break
      }
      case 'members': {
        const result = await getMembers(
          {
            token: context.integration.token,
            page: stream.metadata.page,
            perPage: 200,
            teamId: context.pipelineData.team.id,
          },
          context.logger,
        )

        nextPage = result.nextPage
        if (result.records.length > 0) {
          const { activities } = await this.parseActivities(result.records, stream, context)

          operations.push({
            type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
            records: activities,
          })
        }
        break
      }

      default:
        throw new Error(`Unknown stream value ${stream.value}!`)
    }

    const nextPageStream: IPendingStream = nextPage
      ? { value: stream.value, metadata: { ...(stream.metadata || {}), page: nextPage } }
      : undefined

    return {
      operations,
      lastRecord,
      lastRecordTimestamp: lastRecord ? lastRecord.timestamp.getTime() : undefined,
      newStreams,
      nextPageStream,
    }
  }

  async postprocess(context: IStepContext): Promise<void> {
    // Strip the new property from channels
    context.integration.settings.channels = context.pipelineData.channels.map((ch) => {
      const { new: _, ...raw } = ch
      return raw
    })
  }

  private async parseActivities(
    records: any[],
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<{ activities: AddActivitiesSingle[]; additionalStreams: IPendingStream[] }> {
    switch (stream.value) {
      case 'members': {
        const members = await this.parseMembers(records, context)
        return {
          activities: members,
          additionalStreams: [],
        }
      }
      case 'threads':
        const parseMessagesInThreadsResult = await this.parseMessagesInThreads(
          records,
          stream,
          context,
        )
        return {
          activities: parseMessagesInThreadsResult.activities,
          additionalStreams: parseMessagesInThreadsResult.additionalStreams,
        }
      default:
        const parseMessagesResult = await this.parseMessages(records, stream, context)
        return {
          activities: parseMessagesResult.activities,
          additionalStreams: parseMessagesResult.additionalStreams,
        }
    }
  }

  /**
   * Get the URL for a Slack message
   * @param stream Stream we are parsing
   * @param pipelineData Pipeline data
   * @param record Message record
   * @returns Return the url: workspaceUrl + channelUrl + messageUrl
   */
  private static getUrl(stream, pipelineData, record) {
    const channelId = stream.metadata.channelId
    return `${pipelineData.teamUrl}archives/${channelId}/p${record.ts.replace('.', '')}`
  }

  private static parseMember(record: any, context: IStepContext): Member {
    const member: Member = {
      displayName: record.profile.real_name,
      username: {
        [PlatformType.SLACK]: {
          username: record.name,
          integrationId: context.integration.id,
          sourceId: record.id,
        },
      } as PlatformIdentities,
      emails: record.profile.email ? [record.profile.email] : [],
      attributes: {
        [MemberAttributeName.SOURCE_ID]: {
          [PlatformType.SLACK]: record.id,
        },
        ...(record.profile.image_72 && {
          [MemberAttributeName.AVATAR_URL]: {
            [PlatformType.SLACK]: record.profile.image_72,
          },
        }),
        ...(record.tz_label && {
          [MemberAttributeName.TIMEZONE]: {
            [PlatformType.SLACK]: record.tz_label,
          },
        }),
        ...(record.profile.title && {
          [MemberAttributeName.JOB_TITLE]: {
            [PlatformType.SLACK]: record.profile.title,
          },
        }),
      },
    }

    ;(member as any).platform = PlatformType.SLACK

    return member
  }

  private static async getMember(userId: string, context: IStepContext): Promise<any> {
    const membersCache: RedisCache = context.pipelineData.membersCache

    const cached = await membersCache.get(userId)
    if (cached) {
      if (cached === 'null') {
        return undefined
      }

      return JSON.parse(cached)
    }
    const result = await getMember({ token: context.integration.token, userId }, context.logger)

    const member = result.records

    if (member) {
      await membersCache.set(userId, JSON.stringify(member), 24 * 60 * 60)

      return member
    }

    await membersCache.set(userId, 'null', 24 * 60 * 60)
    return undefined
  }

  private async fetchAndParseMember(context: IStepContext, userId: string): Promise<any> {
    try {
      if (userId === undefined) {
        return undefined
      }

      const record = await SlackIntegrationService.getMember(userId, context)

      if (!record || record.is_bot) {
        return undefined
      }

      return SlackIntegrationService.parseMember(record, context)
    } catch (e) {
      context.logger.error('Error getting member in Slack', { userId })
      throw e
    }
  }

  /**
   * Map the messages coming from Slack to activities and members
   * @param records List of records coming from the API
   * @param stream
   * @param context
   * @returns List of activities and members
   */
  private async parseMessages(
    records: SlackMessages,
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<{ activities: AddActivitiesSingle[]; additionalStreams: IPendingStream[] }> {
    const newStreams: IPendingStream[] = []
    const activities: AddActivitiesSingle[] = []

    for (const record of records) {
      const member = await this.fetchAndParseMember(context, record.user)

      if (member !== undefined) {
        let body = record.text
          ? await SlackIntegrationService.removeMentions(record.text, context)
          : ''

        let activityType
        let score
        let isContribution
        let sourceId
        if (record.subtype === 'channel_join') {
          activityType = 'channel_joined'
          score = SLACK_GRID[SlackActivityType.JOINED_CHANNEL].score
          isContribution = SLACK_GRID[SlackActivityType.JOINED_CHANNEL].isContribution
          body = undefined
          sourceId = record.user
        } else {
          activityType = 'message'
          score = SLACK_GRID[SlackActivityType.MESSAGE].score
          isContribution = SLACK_GRID[SlackActivityType.MESSAGE].isContribution
          sourceId = record.ts
        }
        activities.push({
          username: member.username[PlatformType.SLACK].username,
          tenant: context.integration.tenantId,
          platform: PlatformType.SLACK,
          type: activityType,
          sourceId,
          sourceParentId: '',
          timestamp: moment(parseInt(record.ts, 10) * 1000)
            .utc()
            .toDate(),
          body,
          url: SlackIntegrationService.getUrl(stream, context.pipelineData, record),
          channel: context.pipelineData.channelsInfo[stream.metadata.channelId].name,
          attributes: {
            thread: false,
            reactions: record.reactions ? record.reactions : [],
            attachments: record.attachments ? record.attachments : [],
          },
          score,
          isContribution,
          member,
        })
        if (record.thread_ts) {
          newStreams.push({
            value: 'threads',
            metadata: {
              page: '',
              threadId: record.thread_ts,
              channel: context.pipelineData.channelsInfo[stream.metadata.channelId].name,
              channelId: stream.metadata.channelId,
              placeholder: body,
              new: context.pipelineData.channelsInfo[stream.metadata.channelId].new,
            },
          })
        }
      }
    }

    return {
      activities,
      additionalStreams: newStreams,
    }
  }

  private async parseMembers(
    records: any[],
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const activities: AddActivitiesSingle[] = []
    for (const record of records) {
      if (record.is_bot) {
        // eslint-disable-next-line no-continue
        continue
      }

      const member = SlackIntegrationService.parseMember(record, context)

      activities.push({
        username: member.username[PlatformType.SLACK].username,
        tenant: context.integration.tenantId,
        platform: PlatformType.SLACK,
        type: 'channel_joined',
        sourceId: record.id,
        timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate(),
        body: undefined,
        attributes: {
          thread: false,
          reactions: record.reactions ? record.reactions : [],
          attachments: record.attachments ? record.attachments : [],
        },
        score: SLACK_GRID[SlackActivityType.JOINED_CHANNEL].score,
        isContribution: SLACK_GRID[SlackActivityType.JOINED_CHANNEL].isContribution,
        member,
      })
    }
    return activities
  }

  /**
   * Map the messages coming from Slack to activities and members records to the format of the message to add activities and members
   * @param records List of records coming from the API
   * @param stream
   * @param context
   * @returns List of activities and members
   */
  private async parseMessagesInThreads(
    records: SlackMessages,
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<{ activities: AddActivitiesSingle[]; additionalStreams: IIntegrationStream[] }> {
    const threadInfo = stream.metadata
    const activities: AddActivitiesSingle[] = []
    for (const record of records) {
      const member = await this.fetchAndParseMember(context, record.user)
      if (member !== undefined) {
        const body = record.text
          ? await SlackIntegrationService.removeMentions(record.text, context)
          : ''
        activities.push({
          username: member.username[PlatformType.SLACK].username,
          tenant: context.integration.tenantId,
          platform: PlatformType.SLACK,
          type: 'message',
          sourceId: record.ts,
          sourceParentId: threadInfo.threadId,
          timestamp: moment(parseInt(record.ts, 10) * 1000)
            .utc()
            .toDate(),
          body,
          url: SlackIntegrationService.getUrl(stream, context.pipelineData, record),
          channel: threadInfo.channel,
          attributes: {
            thread: {
              body: sanitizeHtml(threadInfo.placeholder),
              id: threadInfo.threadId,
            },
            reactions: record.reactions ? record.reactions : [],
            attachments: record.attachments ? record.attachments : [],
          },
          member,
          score: SLACK_GRID[SlackActivityType.MESSAGE].score,
          isContribution: SLACK_GRID[SlackActivityType.MESSAGE].isContribution,
        })
      }
    }

    return {
      activities,
      additionalStreams: [],
    }
  }

  /**
   * Parse mentions
   * @param text Message text
   * @param context
   * @returns Message text, swapping mention IDs by mentions
   */
  private static async removeMentions(text: string, context: IStepContext): Promise<string> {
    const regex = /<@!?[^>]*>/
    const globalRegex = /<@!?[^>]*>/g
    const matches = text.match(globalRegex)
    if (matches) {
      for (let match of matches) {
        match = match.replace('<', '').replace('>', '').replace('@', '').replace('!', '')

        const user = await SlackIntegrationService.getMember(match, context)
        const username = user ? user.name : 'mention'
        text = text.replace(regex, `@${username}`)
      }
    }

    return text
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
        if (lastRecord === undefined) return true

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
        if (context.pipelineData.channelsInfo[currentStream.metadata.channelId].new) {
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
}
