/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { SuperfaceClient } from '@superfaceai/one-sdk'
import lodash from 'lodash'
import { IRepositoryOptions } from '../../../database/repositories/IRepositoryOptions'
import { Updates, TwitterReachMessage, AddActivitiesSingle } from '../types/messageTypes'
import {
  parseOutput,
  IntegrationResponse,
  BaseOutput,
  TwitterReachOutput,
} from '../types/iteratorTypes'
import { Endpoint, State } from '../types/regularTypes'
import sendIntegrationsMessage from '../utils/integrationSQS'
import CommunityMemberRepository from '../../../database/repositories/communityMemberRepository'
import bulkOperations from '../../dbOperations/operationsWorker'
import BaseIterator from './baseIterator'
import CommunityMemberService from '../../../services/communityMemberService'
import getProfiles from '../usecases/social/profiles'
import Operations from '../../dbOperations/operations'
import { PlatformType } from '../../../utils/platforms'

export default class TwitterReachIterator extends BaseIterator {
  static readonly TWITTER_API_MAX_USERNAME_LENGTH = 15

  static limitReachedState: State = { endpoint: '__limit', page: '__limit', endpoints: [] }

  static maxRetrospect: number = Number(process.env.TWITTER_MAX_RETROSPECT_IN_SECONDS || 7380)

  static platform: string = PlatformType.TWITTER

  profileId: string

  accessToken: string

  superfaceClient: SuperfaceClient

  /**
   * Constructor for the TwitterReachIterator
   * @param tenant The tenant we are working on
   * @param profileId The ID of the profile we are working on
   * @param accessToken The access token for the profile
   * @param hashtags The hashtags we need to parse
   * @param state The current state (leave empty for starting)
   */
  constructor(
    tenant: string,
    profileId: string,
    accessToken: string,
    members: Array<any>,
    state: State = { endpoint: '', page: '', endpoints: [] },
  ) {
    super(tenant, members, state, false)

    // Twitter-specific attributes
    this.profileId = profileId
    this.accessToken = accessToken
    this.superfaceClient = TwitterReachIterator.initSuperfaceClient()
  }

  /**
   * Get a new page of records from the Twitter usecase
   * @param endpoint Mentions, replies or hashtags
   * @param page Pagination for API
   * @returns A response Object
   */
  async get(endpoint: Endpoint, page: string): Promise<IntegrationResponse> {
    const input = BaseIterator.decodeEndpoint(endpoint).map((member) => member.username)
    const out = await getProfiles(this.superfaceClient, this.accessToken, input)
    return out
  }

  /**
   * Check if the limit is reached
   * @param limit current request limit
   * @returns whether we have reached the limit
   */
  isLimitReached(limit: number): boolean {
    return limit <= 2
  }

  /**
   * Function called when the limit is reached.
   * @param state The current state
   * @param timeUntilReset The time until the limit is reset
   * @returns Dummy success status
   */
  async limitReachedFunction(state: State, timeUntilReset: number): Promise<BaseOutput> {
    const body: TwitterReachMessage = this.getSQSBody(state, timeUntilReset)
    await sendIntegrationsMessage(body)

    return {
      status: 202,
      msg: 'Limit reached, message sent to SQS',
    }
  }

  /**
   * Get the SQS body to call another iterator
   * @param state The current state
   * @param timeUntilReset Time until the limit is reset
   * @returns The SQS message body
   */
  getSQSBody(state: State, timeUntilReset: number): TwitterReachMessage {
    return {
      integration: 'twitter-followers',
      state,
      tenant: this.tenant,
      sleep: timeUntilReset,
      onboarding: this.onboarding,
      args: {
        profileId: this.profileId,
      },
    }
  }

  /**
   *
   * @param records Single-item list of the user object coming from the API
   * @param endpoint User ID we are working on
   * @returns Dummy parseOutput since it is not needed for this
   */
  async parseActivitiesAndWrite(records: Array<object>, endpoint: Endpoint): Promise<parseOutput> {
    // Get updates and send message
    const out: Updates = this.parseReach(records, endpoint)
    await bulkOperations(this.tenant, Operations.UPDATE_MEMBERS, out)
    // We do not need any of this information to know whether we are at the end of the endpoint. For this
    // microservice we are at the end of the endpoint by definition.
    return {
      lastRecord: out.length > 0 ? out[out.length - 1] : {},
      numberOfRecords: out.length,
      activities: [],
    }
  }

  /**
   * Get the followers number of followers
   * @param records List of records coming from the API
   * @param endpoint User ID we are working on
   * @returns The number of followers
   */
  parseReach(records: Array<any>, endpoint: string): Updates {
    const members = TwitterReachIterator.decodeEndpoint(endpoint)
    const out = []
    const hashedMembers = lodash.keyBy(members, 'username')
    records.forEach((record, i) => {
      record.username = record.username.toLowerCase()
      const member = hashedMembers[record.username]
      if (record.followersCount !== member.reach.twitter) {
        out.push({
          id: member.id,
          update: {
            reach: CommunityMemberService.calculateReach(member.reach || {}, {
              twitter: record.followersCount,
            }),
          },
        })
      }
    })
    return out
  }

  integrationSpecificIsEndpointFinished(
    endpoint: string,
    lastRecord: object,
    activities: Array<AddActivitiesSingle>,
  ): boolean {
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async updateStatus(): Promise<void> {}

  async iterate(): Promise<TwitterReachOutput> {
    return { ...(await super.iterate()) }
  }

  static async getMembers(userContext: IRepositoryOptions): Promise<Array<any>> {
    const members = await CommunityMemberRepository.findAndCountAll(
      { filter: { platform: TwitterReachIterator.platform } },
      userContext,
    )
    // Map to object filtering out undefined and long usernames
    return members.rows.reduce((acc, m) => {
      const username = m.username.twitter
      if (
        username !== undefined &&
        username.length < TwitterReachIterator.TWITTER_API_MAX_USERNAME_LENGTH
      ) {
        acc.push({
          id: m.id,
          username: username.toLowerCase(),
          reach: m.reach,
        })
      }
      return acc
    }, [])
  }

  static wrapToEndpoints(members: Array<string>): Array<string> {
    const chunkedNestedArr = lodash.chunk(members, 99)
    return chunkedNestedArr.map((chunk) => JSON.stringify(chunk))
  }
}
