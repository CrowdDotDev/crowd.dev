/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint class-methods-use-this: 0 */

import { SuperfaceClient } from '@superfaceai/one-sdk'
import sanitizeHtml from 'sanitize-html'
import moment from 'moment'
import { BaseOutput, DiscordOutput, IntegrationResponse, parseOutput } from '../types/iteratorTypes'
import { Channels, Endpoint, Endpoints, State } from '../types/regularTypes'
import { AddActivitiesSingle, DiscordIntegrationMessage } from '../types/messageTypes'
import BaseIterator from './baseIterator'
import getMessages from '../usecases/chat/getMessages'
import getMembers from '../usecases/chat/getMembers'
import sendIntegrationsMessage from '../utils/integrationSQS'
import { DiscordGrid } from '../grid/discordGrid'
import getUserContext from '../../../database/utils/getUserContext'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import bulkOperations from '../../dbOperations/operationsWorker'
import Operations from '../../dbOperations/operations'
import { PlatformType } from '../../../utils/platforms'
import { MemberAttributeName } from '../../../database/attributes/member/enums'

export default class DiscordIterator extends BaseIterator {
  static limitReachedState: State = {
    endpoint: '__limit',
    page: '__limit',
  }

  static readonly ENDPOINT_MAX_RETRY = 5

  static maxRetrospect: number = Number(process.env.DISCORD_MAX_RETROSPECT_IN_SECONDS || 3600)

  static globalLimit: number = Number(process.env.DISCORD_GLOBAL_LIMIT || Infinity)

  static fixedEndpoints: Endpoints = ['members']

  channelsInfo: object

  guildId: string

  channels: Channels

  botToken: string

  superfaceClient: SuperfaceClient

  /**
   * Constructor for the DiscordIterator
   * @param tenant The tenant we are working on
   * @param profileId The ID of the profile we are working on
   * @param accessToken The access token for the profile
   * @param hashtags The hashtags we need to parse
   * @param state The current state (leave empty for starting)
   */
  constructor(
    superfaceClient: SuperfaceClient,
    tenant: string,
    guildId: string,
    botToken: string,
    channels: Channels,
    state: State = { endpoint: '', page: '' },
    onboarding: boolean = false,
  ) {
    // Endpoints are the fixed endpoints plus the channels
    const endpoints: Endpoints = DiscordIterator.fixedEndpoints.concat(
      channels.map((channel) => channel.id),
    )

    super(tenant, endpoints, state, onboarding, DiscordIterator.globalLimit)
    this.guildId = guildId
    this.botToken = botToken
    this.channels = channels
    this.channelsInfo = this.channels.reduce((acc, channel) => {
      acc[channel.id] = {
        name: channel.name,
        thread: !!channel.thread,
        new: !!channel.new,
      }
      return acc
    }, {})
    this.superfaceClient = superfaceClient
  }

  /**
   * Get a new page of records from the Discord usecase
   * @param endpoint Mentions, replies or hashtags
   * @param page Pagination for API
   * @returns A response Object
   */
  async get(endpoint: Endpoint, page: string): Promise<IntegrationResponse> {
    // Sleep for rate limit
    await BaseIterator.sleep(2)

    for (let retryCount = 0; retryCount < DiscordIterator.ENDPOINT_MAX_RETRY; retryCount += 1) {
      try {
        // Getting the usecase and main argument
        const { fn, arg } = DiscordIterator.getSuperfaceUsecase(endpoint, this.guildId)
        const { records, nextPage, limit, timeUntilReset } = await fn(
          this.superfaceClient,
          PlatformType.DISCORD,
          this.botToken,
          arg,
          page,
        )
        return {
          records,
          nextPage,
          limit,
          timeUntilReset,
        }
      } catch (error) {
        if (error.statusCode !== 504 && error.statusCode !== 502 && error.statusCode !== 500) {
          throw error
        }

        console.log(
          `Gateway error(${error.statusCode})! Retrying this endpoint ${endpoint} in 2 seconds.`,
        )
        await BaseIterator.sleep(2)
      }
    }

    throw new Error(
      `Couldn't get endpoint: [${endpoint}] after ${DiscordIterator.ENDPOINT_MAX_RETRY} tries`,
    )
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
    switch (endpoint) {
      case 'members':
        return { fn: getMembers, arg: guildId }
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
    switch (endpoint) {
      case 'members':
        return DiscordIterator.isRetrospectOver(
          lastRecord,
          this.startTimestamp,
          DiscordIterator.maxRetrospect,
        )
      default:
        if (this.channelsInfo[endpoint].new) {
          return false
        }

        return DiscordIterator.isRetrospectOver(
          lastRecord,
          this.startTimestamp,
          DiscordIterator.maxRetrospect,
        )
    }
  }

  /**
   * Check if the limit is reached
   * @param limit current request limit
   * @returns whether we have reached the limit
   */
  isLimitReached(limit: number): boolean {
    return limit <= 1
  }

  /**
   * Function called when the limit is reached.
   * @param state The current state
   * @param timeUntilReset The time until the limit is reset
   * @returns Dummy success status
   */
  async limitReachedFunction(state: State, timeUntilReset: number): Promise<BaseOutput> {
    const body: DiscordIntegrationMessage = this.getSQSBody(state, timeUntilReset)
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
  getSQSBody(state: State, timeUntilReset: number): DiscordIntegrationMessage {
    return {
      integration: PlatformType.DISCORD,
      state,
      tenant: this.tenant,
      sleep: timeUntilReset,
      onboarding: this.onboarding,
      args: {
        guildId: this.guildId,
      },
    }
  }

  /**
   * Parses a list of records into a list of activities
   * @param records Records from the API
   * @param endpoint Endpoint to parse
   * @returns Message delivery status
   */
  async parseActivitiesAndWrite(records: Array<object>, endpoint: Endpoint): Promise<parseOutput> {
    const parseOutput = this.parseActivities(records, endpoint)
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
  parseActivities(records: Array<object>, endpoint: Endpoint): parseOutput {
    let activities: Array<AddActivitiesSingle>
    switch (endpoint) {
      case 'members':
        activities = this.parseMembers(records)
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
  parseMembers(records: Array<any>): Array<AddActivitiesSingle> {
    const { tenant } = this
    // We only need the members if they are not bots
    const activities = records.reduce((acc, record) => {
      if (!record.isBot) {
        acc.push({
          tenant,
          platform: PlatformType.DISCORD,
          type: 'joined_guild',
          sourceId: BaseIterator.generateSourceIdHash(
            record.id,
            'joined_guild',
            moment(record.joinedAt).utc().unix().toString(),
            PlatformType.DISCORD,
          ),
          timestamp: moment(record.joinedAt).utc().toDate(),
          member: {
            username: record.username,
            attributes: {
              [PlatformType.DISCORD]:{
                [MemberAttributeName.ID]: record.id
              }
            },
          },
          score: DiscordGrid.join.score,
          isKeyAction: DiscordGrid.join.isKeyAction,
        })
      }
      return acc
    }, [])
    return activities
  }

  /**
   * Parse mentions
   * @param text Message tfext
   * @returns Message text, swapping mention IDs by mentions
   */
  static removeMentions(text: string): string {
    const mentionsText = text.replace(/<@!?[^>]*>/g, '@mention')
    // Replace several occurrences of mentions by one mention
    return mentionsText.replace(/(@mention+\s?){2,}/, '@mentions')
  }

  /**
   * Map the messages coming from Discord to activities and members
   * @param records List of records coming from the API
   * @returns List of activities and members
   */
  parseMessages(records: Array<any>, endpoint: string): Array<AddActivitiesSingle> {
    const { tenant } = this
    const { channelsInfo } = this
    return records.reduce((acc, record) => {
      let parent = ''

      // if we're parsing a thread, mark each message as a child
      if (channelsInfo[endpoint].thread) {
        parent = endpoint
      }

      // record.parentId means that it's a reply
      if (record.parentId) {
        parent = record.parentId
      }

      if (!record.isBot) {
        const activityObject = {
          tenant,
          platform: PlatformType.DISCORD,
          type: 'message',
          sourceId: record.id,
          sourceParentId: parent,
          timestamp: moment(record.createdAt).utc().toDate(),
          body: record.text ? DiscordIterator.removeMentions(record.text) : '',
          url: `https://discordapp.com/channels/${this.guildId}/${endpoint}/${record.id}`,
          channel: channelsInfo[endpoint].name,
          attributes: {
            thread: channelsInfo[endpoint].thread ? channelsInfo[endpoint].name : false,
            reactions: record.reactions ? record.reactions : [],
            attachments: record.attachments ? record.attachments : [],
          },
          member: {
            username: record.author.username,
            attributes: {
              [PlatformType.DISCORD]:{
                [MemberAttributeName.ID]: record.author.id
              }
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

  async updateStatus(): Promise<void> {
    const userContext = await getUserContext(this.tenant)
    const integration = await IntegrationRepository.findByPlatform(
      PlatformType.DISCORD,
      userContext,
    )
    await IntegrationRepository.update(integration.id, { status: 'done' }, userContext)
  }

  async iterate(): Promise<DiscordOutput> {
    return {
      ...(await super.iterate()),
      channels: this.channels,
    }
  }
}
