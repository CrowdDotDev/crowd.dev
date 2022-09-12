/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint class-methods-use-this: 0 */

import { SuperfaceClient } from '@superfaceai/one-sdk'
import sanitizeHtml from 'sanitize-html'
import moment from 'moment'
import {
  BaseOutput,
  IntegrationResponse,
  parseOutput,
  SlackOutput,
  Thread,
} from '../types/iteratorTypes'
import { Channels, Endpoint, Endpoints, State } from '../types/regularTypes'
import { AddActivitiesSingle, SlackIntegrationMessage } from '../types/messageTypes'
import BaseIterator from './baseIterator'
import getMessages from '../usecases/chat/getMessages'
import getMembers from '../usecases/chat/getMembers'
import sendIntegrationsMessage from '../utils/integrationSQS'
import { SlackGrid } from '../grid/slackGrid'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import { IRepositoryOptions } from '../../../database/repositories/IRepositoryOptions'
import getMessagesThreads from '../usecases/chat/getMessagesThreads'
import bulkOperations from '../../dbOperations/operationsWorker'
import Operations from '../../dbOperations/operations'
import { PlatformType } from '../../../utils/platforms'

export default class SlackIterator extends BaseIterator {
  static limitReachedState: State = {
    endpoints: [],
    endpoint: '__limit',
    page: '__limit',
  }

  static maxRetrospect: number = Number(process.env.SLACK_MAX_RETROSPECT_IN_SECONDS || 3600)

  static globalLimit: number = Number(process.env.SLACK_GLOBAL_LIMIT || Infinity)

  static fixedEndpoints: Endpoints = ['members']

  superfaceClient: SuperfaceClient

  channelsInfo: object

  guildId: string

  channels: Channels

  members: Object

  accessToken: string

  integrationId: string

  userContext: IRepositoryOptions

  /**
   *
   * @param tenant The tenant we are getting data for
   * @param accessToken Access token for Slack
   * @param channels List of channels
   * @param members Object with memberId -> memberName
   * @param integrationId Id of the integration
   * @param userContext User context for DB
   * @param state Initial state
   * @param onboarding Whether we are onboarding or not
   */
  constructor(
    superfaceClient: SuperfaceClient,
    tenant: string,
    accessToken: string,
    channels: Channels,
    members: Object,
    integrationId: string,
    userContext: IRepositoryOptions,
    state: State = { endpoint: '', page: '', endpoints: [] },
    onboarding: boolean = false,
  ) {
    let endpoints: Endpoints = state.endpoints
    // Endpoints are the fixed endpoints plus the channels
    if (state.endpoints.length === 0) {
      endpoints = SlackIterator.fixedEndpoints.concat(channels.map((channel) => channel.id))
    }

    super(tenant, endpoints, state, onboarding, SlackIterator.globalLimit)

    this.superfaceClient = superfaceClient
    this.accessToken = accessToken
    this.channels = channels
    this.members = members
    this.integrationId = integrationId
    this.userContext = userContext
    this.channelsInfo = this.channels.reduce((acc, channel) => {
      acc[channel.id] = {
        name: channel.name,
        new: !!channel.new,
      }
      return acc
    }, {})
  }

  /**
   * Get a new page of records from the Slack usecase
   * @param endpoint Members, channels or threads
   * @param page Pagination for API
   * @returns A response Object
   */
  async get(endpoint: Endpoint, page: string): Promise<IntegrationResponse> {
    // Sleep for rate limit
    await BaseIterator.sleep(1)
    // Getting the usecase and main argument
    const { fn, arg } = SlackIterator.getSuperfaceUsecase(endpoint, this.guildId)
    const { records, nextPage, limit, timeUntilReset } = await fn(
      this.superfaceClient,
      PlatformType.SLACK,
      this.accessToken,
      arg,
      page,
      200,
    )
    return {
      records,
      nextPage,
      limit,
      timeUntilReset,
    }
  }

  /**
   * Get the Superface usecase for the given endpoint with its main argument
   * @param endpoint The endpoint we are currently targetting
   * @param profileId The ID of the profile we are getting data for
   * @returns The function to call, as well as its main argument
   */
  static getSuperfaceUsecase(
    endpoint: Endpoint,
    guildId: string,
  ): {
    fn: Function
    arg: string
  } {
    switch (SlackIterator.switchCases(endpoint)) {
      case 'members':
        return { fn: getMembers, arg: guildId }
      case 'threads':
        return { fn: getMessagesThreads, arg: endpoint }
      default:
        return { fn: getMessages, arg: endpoint }
    }
  }

  /**
   * Returns whether the current endpoint is finished
   * - If we are getting members, we just need to check if we are over the desired retrospect
   * - If we are getting messages:
   *   - If it is a new channel, return false as we want all the messages
   *   - If it is an old channel, check retrospect
   * @param endpoint The endpoint we are currently targetting
   * @param lastRecord The last activity we are got
   * @returns Whether the endpoint is finished
   */
  integrationSpecificIsEndpointFinished(
    endpoint: string,
    lastRecord: any,
    activities: Array<AddActivitiesSingle> = [],
  ): boolean {
    switch (SlackIterator.switchCases(endpoint)) {
      case 'members':
        return lastRecord.sourceId in this.members
      case 'threads':
        if ((BaseIterator.decodeEndpoint(endpoint) as Thread).new) {
          return false
        }

        return SlackIterator.isRetrospectOver(
          lastRecord,
          this.startTimestamp,
          SlackIterator.maxRetrospect,
        )

      default:
        if (this.channelsInfo[endpoint].new) {
          return false
        }

        return SlackIterator.isRetrospectOver(
          lastRecord,
          this.startTimestamp,
          SlackIterator.maxRetrospect,
        )
    }
  }

  /**
   * Get the case for switches. This is needed because threaded messages and normal messages are handled differently
   * and the endpoints are not denoted by a sole keyword. Threads are denoted by a 'thread' keyword in the endpoint.
   * @param endpoint Current endpoint
   * @returns The case for switching. Either members, threads or the endpoint.
   */
  static switchCases(endpoint) {
    if (endpoint === 'members') {
      return 'members'
    }
    if (endpoint.includes('thread')) {
      return 'threads'
    }
    return endpoint
  }

  /**
   * There is no limit in Slack
   * @param limit current request limit
   * @returns false
   */
  isLimitReached(limit: number): boolean {
    return false
  }

  /**
   * Function called when the limit is reached.
   * @param state The current state
   * @param timeUntilReset The time until the limit is reset
   * @returns Dummy success status
   */
  async limitReachedFunction(state: State, timeUntilReset: number): Promise<BaseOutput> {
    const body: SlackIntegrationMessage = this.getSQSBody(state, timeUntilReset)
    await sendIntegrationsMessage(body)

    return {
      status: 200,
      msg: 'Limit reached, message sent to SQS',
    }
  }

  /**
   * Get the SQS body to call another iterator
   * @param state The current state
   * @param timeUntilReset Time until the limit is reset
   * @returns The SQS message body
   */
  getSQSBody(state: State, timeUntilReset: number): SlackIntegrationMessage {
    return {
      integration: PlatformType.SLACK,
      state,
      tenant: this.tenant,
      sleep: timeUntilReset,
      onboarding: this.onboarding,
      args: {},
    }
  }

  /**
   * Parses a list of records into a list of activities
   * @param records Records from the API
   * @param endpoint Endpoint to parse
   * @returns Message delivery status
   */
  async parseActivitiesAndWrite(records: Array<object>, endpoint: Endpoint): Promise<parseOutput> {
    const parseOutput = await this.parseActivities(records, endpoint)
    await bulkOperations(
      this.tenant,
      Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
      parseOutput.activities,
    )
    return parseOutput
  }

  /**
   * Get the activities and members formatted as SQS message bodies from
   * the set of records obtained in the API.
   * @param records List of records coming from the API
   * @param endpoint Endpoint we are working on
   * @returns The set of activities and the date of the last activity
   */
  async parseActivities(records: Array<object>, endpoint: Endpoint): Promise<parseOutput> {
    let activities: Array<AddActivitiesSingle>
    switch (SlackIterator.switchCases(endpoint)) {
      case 'members':
        activities = await this.parseMembers(records)
        if (activities.length > 0) {
          return {
            activities,
            lastRecord: activities[activities.length - 1],
            numberOfRecords: activities.length,
          }
        }

        return {
          activities,
          lastRecord: {},
          numberOfRecords: 0,
        }

      case 'threads':
        activities = this.parseMessagesInThreads(records, endpoint)
        return {
          activities,
          lastRecord: activities[activities.length - 1],
          numberOfRecords: activities.length,
        }
      default:
        activities = this.parseMessages(records, endpoint)
        return {
          activities,
          lastRecord: activities[activities.length - 1],
          numberOfRecords: activities.length,
        }
    }
  }

  /**
   * Map the members records to the format of the message to add activities and members
   * @param records List of records coming from the API
   * @returns List of activities and members
   */
  async parseMembers(records: Array<any>): Promise<Array<AddActivitiesSingle>> {
    const { tenant } = this
    // We only need the members if they are not bots
    const _vm = this
    const activities = records.reduce((acc, record) => {
      if (!(record.isBot || record.username === 'Slackbot' || record.id in _vm.members)) {
        _vm.members[record.id] = record.username
        acc.push({
          tenant,
          platform: PlatformType.SLACK,
          type: 'channel_joined',
          sourceId: record.id,
          timestamp: _vm.onboarding
            ? moment('1970-01-01T00:00:00+00:00').utc().toDate()
            : moment().utc().toDate(),
          crowdInfo: {},
          communityMember: {
            username: record.username,
            crowdInfo: {
              id: record.id,
            },
          },
          score: SlackGrid.join.score,
          isKeyAction: SlackGrid.join.isKeyAction,
        })
      }
      return acc
    }, [])

    // Call the updateMembers. This needs to happen synchronously every time
    await this.updateMembers()
    return activities
  }

  /**
   * Update members for an integration.
   * This update needs to happen synchronously, since the message endpoints need these members
   */
  async updateMembers() {
    const integration = await IntegrationRepository.findById(this.integrationId, this.userContext)
    const settings = {
      members: this.members,
      channels: integration.settings.channels || [],
    }
    await IntegrationRepository.update(this.integrationId, { settings }, this.userContext)
  }

  /**
   * Make a thread endpoint when a thread is found
   * @param threadId The thread ID
   * @param channelId The channel where the thread belongs
   * @param placeholder The placeholder for the original message
   * @returns A string representing the thread endpoint
   */
  encodeThreadEndpoint(threadId: string, channelId: string, placeholder: string): string {
    return JSON.stringify({
      threadId,
      channel: this.channelsInfo[channelId].name,
      channelId,
      placeholder,
      new: this.channelsInfo[channelId].new,
    })
  }

  /**
   * Add a thread to the endpoints interator list
   * @param starterBody Body of the thread starter message
   * @param threadId If of the started thread
   * @param channelId If of the channel the thread belongs to
   */
  addThreadToEndpoints(threadId: string, channelId: string, starterBody: string) {
    this.endpointsIterator = this.endpointsIterator
      .slice(0, this.endpointsIterator.indexOf(channelId) + 1)
      .concat(this.encodeThreadEndpoint(threadId, channelId, starterBody))
      .concat(this.endpointsIterator.slice(this.endpointsIterator.indexOf(channelId) + 1))
  }

  /**
   * Parse mentions
   * @param text Message text
   * @returns Message text, swapping mention IDs by mentions
   */
  removeMentions(text: string): string {
    const regex = /<@!?[^>]*>/
    const globalRegex = /<@!?[^>]*>/g
    const matches = text.match(globalRegex)
    if (matches) {
      for (let match of matches) {
        match = match.replace('<', '').replace('>', '').replace('@', '').replace('!', '')
        text = text.replace(regex, `@${this.members[match] || 'mention'}`)
      }
    }

    return text
  }

  /**
   * Map the messages coming from Slack to activities and members
   * @param records List of records coming from the API
   * @returns List of activities and members
   */
  parseMessages(records: Array<any>, endpoint: string): Array<AddActivitiesSingle> {
    const { tenant } = this
    const { channelsInfo } = this
    const _vm = this
    return records.reduce((acc, record) => {
      if (!record.isBot && _vm.members[record.author?.id]) {
        const body = record.text ? _vm.removeMentions(record.text) : ''
        acc.push({
          tenant,
          platform: PlatformType.SLACK,
          type: 'message',
          sourceId: record.id,
          sourceParentId: '',
          timestamp: moment(record.createdAt).utc().toDate(),
          crowdInfo: {
            body: sanitizeHtml(body),
            url: record.url ? record.url : '',
            channel: channelsInfo[endpoint].name,
            thread: false,
            reactions: record.reactions ? record.reactions : [],
            attachments: record.attachments ? record.attachments : [],
          },
          communityMember: {
            username: _vm.members[record.author.id],
            crowdInfo: {
              id: record.author.id,
            },
          },
          score: SlackGrid.message.score,
          isKeyAction: SlackGrid.message.isKeyAction,
        })

        if (record.hasThread) {
          _vm.addThreadToEndpoints(record.threadId, endpoint, body)
        }
      }
      return acc
    }, [])
  }

  /**
   * Map the messages coming from Slack to activities and members records to the format of the message to add activities and members
   * @param records List of records coming from the API
   * @returns List of activities and members
   */
  parseMessagesInThreads(records: Array<any>, endpoint: string): Array<AddActivitiesSingle> {
    const { tenant } = this
    const threadInfo = BaseIterator.decodeEndpoint(endpoint)
    const _vm = this
    return records.reduce((acc, record) => {
      if (!record.isBot && _vm.members[record.author.id]) {
        const body = record.text ? _vm.removeMentions(record.text) : ''
        acc.push({
          tenant,
          platform: PlatformType.SLACK,
          type: 'message',
          sourceId: record.id,
          sourceParentId: threadInfo.threadId,
          timestamp: moment.unix(record.createdAt).utc().toDate(),
          crowdInfo: {
            body: sanitizeHtml(body),
            url: record.url ? record.url : '',
            channel: threadInfo.channel,
            thread: {
              body: sanitizeHtml(threadInfo.placeholder),
              id: threadInfo.threadId,
            },
            reactions: record.reactions ? record.reactions : [],
            attachments: record.attachments ? record.attachments : [],
          },
          communityMember: {
            username: _vm.members[record.author.id],
            crowdInfo: {
              id: record.author.id,
            },
          },
          score: SlackGrid.message.score,
          isKeyAction: SlackGrid.message.isKeyAction,
        })
      }
      return acc
    }, [])
  }

  async updateStatus(): Promise<void> {
    const integration = await IntegrationRepository.findByPlatform(
      PlatformType.SLACK,
      this.userContext,
    )
    await IntegrationRepository.update(integration.id, { status: 'done' }, this.userContext)
  }

  async iterate(): Promise<SlackOutput> {
    return {
      ...(await super.iterate()),
      channels: this.channels,
    }
  }
}
