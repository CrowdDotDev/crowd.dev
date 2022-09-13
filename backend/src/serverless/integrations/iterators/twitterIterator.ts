/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint class-methods-use-this: 0 */

import { SuperfaceClient } from '@superfaceai/one-sdk'
import sanitizeHtml from 'sanitize-html'
import lodash from 'lodash'
import moment from 'moment'
import { parseOutput, IntegrationResponse, BaseOutput, TwitterOutput } from '../types/iteratorTypes'
import { Endpoint, Endpoints, State } from '../types/regularTypes'
import { TwitterIntegrationMessage, AddActivitiesSingle } from '../types/messageTypes'
import BaseIterator from './baseIterator'
import findPostsByHashtag from '../usecases/social/postsByHashtag'
import findPostsByMention from '../usecases/social/postsByMention'
import getFollowers from '../usecases/social/followers'
import { SocialResponse } from '../types/superfaceTypes'
import sendIntegrationsMessage from '../utils/integrationSQS'
import { TwitterGrid } from '../grid/twitterGrid'
import getUserContext from '../../../database/utils/getUserContext'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import MicroserviceService from '../../../services/microserviceService'
import * as microserviceTypes from '../../../database/utils/keys/microserviceTypes'
import bulkOperations from '../../dbOperations/operationsWorker'
import Operations from '../../dbOperations/operations'
import { PlatformType } from '../../../utils/platforms'

export default class TwitterIterator extends BaseIterator {
  static limitReachedState: State = {
    endpoints: [],
    endpoint: '__limit',
    page: '__limit',
  }

  // Some endpoints are hard-coded since they are fixed
  static fixedEndpoints: Endpoints = ['followers', 'mentions']

  static maxRetrospect: number = Number(process.env.TWITTER_MAX_RETROSPECT_IN_SECONDS || 7380)

  profileId: string

  accessToken: string

  hashtags: Array<string>

  followers: Set<string>

  superfaceClient: SuperfaceClient

  /**
   * Constructor for the TwitterIterator
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
    hashtags: Array<string>,
    state: State = { endpoint: '', page: '', endpoints: [] },
    onboarding: boolean = false,
    tweetCount: number = 0,
    followers: Set<string> = new Set(),
  ) {
    const endpoints: Endpoints = TwitterIterator.fixedEndpoints.concat(
      (hashtags || []).map((hashtag) => `hashtag/${hashtag}`),
    )

    let globalLimit = Number(process.env.TWITTER_GLOBAL_LIMIT || 10000)

    globalLimit = onboarding ? globalLimit * 0.7 : globalLimit
    super(tenant, endpoints, state, onboarding, globalLimit, tweetCount)

    // Twitter-specific attributes
    this.profileId = profileId
    this.accessToken = accessToken
    this.hashtags = hashtags
    this.followers = followers
    this.superfaceClient = TwitterIterator.initSuperfaceClient()
  }

  /**
   * Get after date for Twitter.
   * We need this to avoid overlapping tweets.
   * @returns A date or undefined
   */
  getAfterDate(): string | undefined {
    return this.onboarding
      ? undefined
      : moment().utc().subtract(TwitterIterator.maxRetrospect, 'seconds').toISOString()
  }

  /**
   * Get a new page of records from the Twitter usecase
   * @param endpoint Mentions, replies or hashtags
   * @param page Pagination for API
   * @returns A response Object
   */
  async get(endpoint: Endpoint, page: string): Promise<IntegrationResponse> {
    // Get the usecase and its main argument
    const { fn, arg } = await TwitterIterator.getSuperfaceUsecase(endpoint, this.profileId)

    const afterDate = this.onboarding
      ? undefined
      : moment().utc().subtract(TwitterIterator.maxRetrospect, 'seconds').toISOString()

    // Get the records
    const { records, nextPage, limit, timeUntilReset } = await fn(
      this.superfaceClient,
      this.accessToken,
      arg,
      page,
      afterDate,
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
    profileId: string,
  ): {
    fn: (
      client: SuperfaceClient,
      accessToken: string,
      arg: string,
      page?: string,
      afterDate?: string | undefined,
    ) => Promise<SocialResponse>
    arg: string
  } {
    switch (endpoint) {
      case 'followers':
        return { fn: getFollowers, arg: profileId }
      case 'mentions':
        return { fn: findPostsByMention, arg: profileId }
      default: {
        const hashtag = endpoint.includes('#')
          ? endpoint.slice(endpoint.indexOf('#') + 1)
          : endpoint.slice(endpoint.indexOf('/') + 1)
        return { fn: findPostsByHashtag, arg: hashtag }
      }
    }
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
    const body: TwitterIntegrationMessage = this.getSQSBody(state, timeUntilReset)
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
  getSQSBody(state: State, timeUntilReset: number): TwitterIntegrationMessage {
    return {
      integration: PlatformType.TWITTER,
      state,
      tenant: this.tenant,
      sleep: timeUntilReset,
      onboarding: this.onboarding,
      args: {
        profileId: this.profileId,
        hashtags: this.hashtags,
      },
    }
  }

  async parseActivitiesAndWrite(records: Array<object>, endpoint: Endpoint): Promise<parseOutput> {
    const parseOutput = this.parseActivities(records, endpoint)
    let endpointSqs: string
    switch (endpoint) {
      case 'followers':
        endpointSqs = 'followers'
        break
      case 'mentions':
        endpointSqs = 'mentions'
        break
      default:
        endpointSqs = 'add-hashtags'
    }
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
   * @returns The set of messages and the date of the last activity
   */
  parseActivities(records: Array<any>, endpoint: Endpoint): parseOutput {
    switch (endpoint) {
      case 'followers': {
        const followers = this.parseFollowers(records)

        // Update the follower set
        this.followers = new Set([...this.followers, ...records.map((record) => record.id)])

        if (followers.length > 0) {
          return {
            activities: followers,
            lastRecord: followers[followers.length - 1],
            numberOfRecords: followers.length,
          }
        }
        return {
          activities: [],
          lastRecord: {},
          numberOfRecords: 0,
        }
      }
      default: {
        const posts: Array<AddActivitiesSingle> = this.parsePosts(records, endpoint)

        // Increment the Tweet count
        this.limitCount += posts.length

        return {
          activities: posts,
          lastRecord: posts[posts.length - 1],
          numberOfRecords: posts.length,
        }
      }
    }
  }

  /**
   * Map the follower records to the format of the message to add activities and members
   * @param records List of records coming from the API
   * @returns List of activities and members
   */
  parseFollowers(records: Array<any>): Array<AddActivitiesSingle> {
    const a = JSON.parse(JSON.stringify(records))
    const timestampObj = this.onboarding
      ? moment('1970-01-01T00:00:00+00:00').utc()
      : moment().utc()
    let out = records.map((record) => ({
      tenant: this.tenant,
      platform: PlatformType.TWITTER,
      type: 'follow',
      sourceId: BaseIterator.generateSourceIdHash(
        record.username,
        'follow',
        moment('1970-01-01T00:00:00+00:00').utc().unix().toString(),
        PlatformType.TWITTER,
      ),
      // When onboarding we need a super old date. Otherwise we can place it in a 2h window
      timestamp: timestampObj.toDate(),
      crowdInfo: {
        url: `https://twitter.com/${record.username}`,
      },
      communityMember: {
        username: record.username,
        reach: { twitter: record.followersCount },
        crowdInfo: {
          id: record.id,
          imageUrl: record.imageUrl,
          url: `https://twitter.com/${record.username}`,
        },
      },
      score: TwitterGrid.follow.score,
      isKeyAction: TwitterGrid.follow.isKeyAction,
    }))

    // It is imperative that we remove the followers we have already seen.
    // Since they come without timestamps and we have set the followers timestamp to now(),
    // this would cause repeated activities otherwise
    out = out.filter((activity) => !this.followers.has(activity.communityMember.crowdInfo.id))

    return out
  }

  /**
   * Map the posts (mentions or hashtags) records to the format of the message to add activities and members
   * @param records List of records coming from the API
   * @returns List of activities and members
   */
  parsePosts(records: Array<any>, endpoint: Endpoint): Array<AddActivitiesSingle> {
    return records.map((record) => {
      const out: any = {
        tenant: this.tenant,
        platform: PlatformType.TWITTER,
        type: endpoint === 'mentions' ? 'mention' : 'hashtag',
        sourceId: record.id,
        timestamp: moment(Date.parse(record.createdAt)).utc().toDate(),
        crowdInfo: {
          sourceId: record.id,
          body: record.text ? sanitizeHtml(record.text) : '',
          url: record.url ? record.url : '',
          attachments: record.attachments ? record.attachments : [],
        },
        communityMember: {
          username: record.author.username,
          crowdInfo: {
            id: record.author.id,
            url: `https://twitter.com/${record.author.username}`,
          },
          reach: { twitter: record.author.followersCount },
        },
        score: endpoint === 'mentions' ? TwitterGrid.mention.score : TwitterGrid.hashtag.score,
        isKeyAction:
          endpoint === 'mentions'
            ? TwitterGrid.mention.isKeyAction
            : TwitterGrid.hashtag.isKeyAction,
      }

      if (endpoint.includes('hashtag')) {
        out.crowdInfo.hashtag = TwitterIterator.getHashtag(endpoint)
      }
      return out
    })
  }

  /**
   * Get a hashtag for crowdInfo.hashtag
   * @param endpoint The current endpoint
   * @returns The name of the hashtag
   */
  static getHashtag(endpoint: Endpoint): string {
    return endpoint.includes('#')
      ? endpoint.slice(endpoint.indexOf('#') + 1)
      : endpoint.slice(endpoint.indexOf('/') + 1)
  }

  /**
   * Map a field of activities given a path
   * - ([{crowdInfo: 1}, {crowdInfo: 2}], crowdInfo) => [1, 2]
   * @param activities Array of activities to be mapped
   * @param path Path to the field of the activity we want
   * @returns A list of the values of the field of the activities
   */
  static mapToPath(activities: Array<any>, path: string) {
    return activities.map((activity) => lodash.get(activity, path))
  }

  /**
   * Checks whether any element of the array is the same of any element in the set
   * @param set Set of elements
   * @param array Array of elements
   * @returns Boolean
   */
  static isJoin(set: Set<any>, array: Array<any>): boolean {
    const arrayToSet = new Set(array)
    return new Set([...set, ...arrayToSet]).size !== set.size + arrayToSet.size
  }

  integrationSpecificIsEndpointFinished(
    endpoint: string,
    lastRecord: object,
    activities: Array<AddActivitiesSingle>,
  ): boolean {
    switch (endpoint) {
      case 'followers':
        return TwitterIterator.isJoin(
          this.followers,
          TwitterIterator.mapToPath(activities, 'communityMember.crowdInfo.id'),
        )

      default:
        return TwitterIterator.isRetrospectOver(
          lastRecord,
          this.startTimestamp,
          TwitterIterator.maxRetrospect,
        )
    }
  }

  async updateStatus(): Promise<void> {
    const userContext = await getUserContext(this.tenant)
    const integration = await IntegrationRepository.findByPlatform(
      PlatformType.TWITTER,
      userContext,
    )

    if (this.onboarding) {
      await IntegrationRepository.update(integration.id, { status: 'done' }, userContext)
      await new MicroserviceService(userContext).createIfNotExists({
        type: microserviceTypes.twitterFollowers,
      })
    }
  }

  async iterate(): Promise<TwitterOutput> {
    return {
      ...(await super.iterate()),
      followers: Array.from(this.followers),
      tweetCount: this.limitCount,
    }
  }
}
