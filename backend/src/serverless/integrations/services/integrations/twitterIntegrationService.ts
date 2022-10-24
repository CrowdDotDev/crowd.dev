import { SuperfaceClient } from '@superfaceai/one-sdk'
import moment from 'moment'
import lodash from 'lodash'
import { IntegrationServiceBase } from '../integrationServiceBase'
import { IntegrationType, PlatformType } from '../../../../types/integrationEnums'
import { TWITTER_CONFIG } from '../../../../config'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
  IStreamResultOperation,
} from '../../../../types/integration/stepResult'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import { TwitterMemberAttributes } from '../../../../database/attributes/member/twitter'
import { Endpoint } from '../../types/regularTypes'
import { SocialResponse } from '../../types/superfaceTypes'
import getFollowers from '../../usecases/social/followers'
import findPostsByMention from '../../usecases/social/postsByMention'
import findPostsByHashtag from '../../usecases/social/postsByHashtag'
import { AddActivitiesSingle } from '../../types/messageTypes'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { TwitterGrid } from '../../grid/twitterGrid'
import Operations from '../../../dbOperations/operations'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class TwitterIntegrationService extends IntegrationServiceBase {
  static maxRetrospect: number = TWITTER_CONFIG.maxRetrospectInSeconds || 7380

  constructor() {
    super(IntegrationType.TWITTER, 30)

    this.globalLimit = TWITTER_CONFIG.globalLimit || 0
    this.onboardingLimitModifierFactor = 0.7
    this.limitResetFrequencySeconds = (TWITTER_CONFIG.limitResetFrequencyDays || 0) * 24 * 60 * 60
  }

  async preprocess(context: IStepContext): Promise<void> {
    await TwitterIntegrationService.refreshToken(context)
    context.pipelineData.followers = new Set<string>(context.integration.followers)
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.serviceContext)
    await service.createPredefined(TwitterMemberAttributes)
  }

  async getStreams(context: IStepContext): Promise<IIntegrationStream[]> {
    const hashtags = context.integration.settings.hashtags

    return ['followers', 'mentions']
      .concat((hashtags || []).map((h) => `hashtag/${h}`))
      .map((s) => ({
        value: s,
        metadata: { page: '' },
      }))
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const { fn, arg } = TwitterIntegrationService.getSuperfaceUsecase(
      stream.value,
      context.pipelineData.profileId,
    )

    const afterDate = context.onboarding
      ? undefined
      : moment().utc().subtract(TwitterIntegrationService.maxRetrospect, 'seconds').toISOString()

    const { records, nextPage, limit, timeUntilReset } = await fn(
      context.pipelineData.superface,
      context.integration.token,
      arg,
      stream.metadata.page,
      afterDate,
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

    const activities = this.parseActivities(context, records, stream)

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
  }

  async isProcessingFinished(
    context: IStepContext,
    currentStream: IIntegrationStream,
    lastOperations: IStreamResultOperation[],
    lastRecord?: any,
    lastRecordTimestamp?: number,
  ): Promise<boolean> {
    switch (currentStream.value) {
      case 'followers':
        return TwitterIntegrationService.isJoin(
          context.pipelineData.followers,
          TwitterIntegrationService.mapToPath(
            lastOperations.flatMap((o) => o.records),
            'member.attributes.twitter.sourceId',
          ),
        )

      default:
        if (lastRecordTimestamp === undefined) return true

        return IntegrationServiceBase.isRetrospectOver(
          lastRecordTimestamp,
          context.startTimestamp,
          TwitterIntegrationService.maxRetrospect,
        )
    }
  }

  async postprocess(
    context: IStepContext,
    failedStreams?: IIntegrationStream[],
    remainingStreams?: IIntegrationStream[],
  ): Promise<void> {
    if (context.onboarding) {
      // When we are onboarding we reset the frequency to RESET_FREQUENCY_DAYS.in_hours - 6 hours.
      // This is because the tweets allowed during onboarding are free. Like this, the limit will reset 6h after the onboarding.
      context.integration.limitLastResetAt = moment()
        .utc()
        .subtract(this.limitResetFrequencySeconds * 2, 'seconds')
        .format('YYYY-MM-DD HH:mm:ss')
    }

    context.integration.settings.followers = Array.from(context.pipelineData.followers.values())
  }

  /**
   * Get the activities and members formatted as SQS message bodies from
   * the set of records obtained in the API.
   * @param context process step context data
   * @param records List of records coming from the API
   * @param stream integration stream that we are currently processing
   * @returns The set of messages and the date of the last activity
   */
  parseActivities(
    context: IStepContext,
    records: Array<any>,
    stream: IIntegrationStream,
  ): AddActivitiesSingle[] {
    switch (stream.value) {
      case 'followers': {
        const followers = this.parseFollowers(context, records)

        // Update the follower set
        context.pipelineData.followers = new Set([
          ...context.pipelineData.followers,
          ...records.map((record) => record.id),
        ])

        if (followers.length > 0) {
          return followers
        }
        return []
      }
      default: {
        return this.parsePosts(context, records, stream)
      }
    }
  }

  /**
   * Map the follower records to the format of the message to add activities and members
   * @param context process step context data
   * @param records List of records coming from the API
   * @returns List of activities and members
   */
  parseFollowers(context: IStepContext, records: Array<any>): Array<AddActivitiesSingle> {
    const timestampObj = context.onboarding
      ? moment('1970-01-01T00:00:00+00:00').utc()
      : moment().utc()
    let out = records.map((record) => ({
      tenant: context.integration.tenantId,
      platform: PlatformType.TWITTER,
      type: 'follow',
      sourceId: IntegrationServiceBase.generateSourceIdHash(
        record.username,
        'follow',
        moment('1970-01-01T00:00:00+00:00').utc().unix().toString(),
        PlatformType.TWITTER,
      ),
      // When onboarding we need an old date. Otherwise, we can place it in a 2h window
      timestamp: timestampObj.toDate(),
      url: `https://twitter.com/${record.username}`,
      member: {
        username: record.username,
        reach: { [PlatformType.TWITTER]: record.followersCount },
        attributes: {
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.TWITTER]: record.id,
          },
          [MemberAttributeName.IMAGE_URL]: {
            [PlatformType.TWITTER]: record.imageUrl,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.TWITTER]: `https://twitter.com/${record.username}`,
          },
        },
      },
      score: TwitterGrid.follow.score,
      isKeyAction: TwitterGrid.follow.isKeyAction,
    }))

    // It is imperative that we remove the followers we have already seen.
    // Since they come without timestamps, and we have set the followers timestamp to now(),
    // this would cause repeated activities otherwise
    out = out.filter(
      (activity) =>
        !context.pipelineData.followers.has(
          activity.member.attributes[MemberAttributeName.SOURCE_ID][PlatformType.TWITTER],
        ),
    )

    return out
  }

  /**
   * Map the posts (mentions or hashtags) records to the format of the message to add activities and members
   * @param context process step context data
   * @param records List of records coming from the API
   * @param stream integration stream that we are currently processing
   * @returns List of activities and members
   */
  parsePosts(
    context: IStepContext,
    records: Array<any>,
    stream: IIntegrationStream,
  ): Array<AddActivitiesSingle> {
    return records.map((record) => {
      const out: any = {
        tenant: context.integration.tenantId,
        platform: PlatformType.TWITTER,
        type: stream.value === 'mentions' ? 'mention' : 'hashtag',
        sourceId: record.id,
        timestamp: moment(Date.parse(record.createdAt)).utc().toDate(),
        body: record.text ? record.text : '',
        url: record.url ? record.url : '',
        attributes: {
          attachments: record.attachments ? record.attachments : [],
        },
        member: {
          username: record.author.username,
          attributes: {
            [MemberAttributeName.SOURCE_ID]: {
              [PlatformType.TWITTER]: record.author.id,
            },
            [MemberAttributeName.URL]: {
              [PlatformType.TWITTER]: `https://twitter.com/${record.author.username}`,
            },
          },
          reach: { [PlatformType.TWITTER]: record.author.followersCount },
        },
        score: stream.value === 'mentions' ? TwitterGrid.mention.score : TwitterGrid.hashtag.score,
        isKeyAction:
          stream.value === 'mentions'
            ? TwitterGrid.mention.isKeyAction
            : TwitterGrid.hashtag.isKeyAction,
      }

      if (stream.value.includes('hashtag')) {
        out.attributes.hashtag = TwitterIntegrationService.getHashtag(stream.value)
      }
      return out
    })
  }

  /**
   * Get a hashtag for `attributes.hashtag`
   * @param endpoint The current endpoint
   * @returns The name of the hashtag
   */
  private static getHashtag(endpoint: Endpoint): string {
    return endpoint.includes('#')
      ? endpoint.slice(endpoint.indexOf('#') + 1)
      : endpoint.slice(endpoint.indexOf('/') + 1)
  }

  /**
   * Map a field of activities given a path
   * - ([{attributes: 1}, {attributes: 2}], attributes) => [1, 2]
   * @param activities Array of activities to be mapped
   * @param path Path to the field of the activity we want
   * @returns A list of the values of the field of the activities
   */
  private static mapToPath(activities: Array<any>, path: string) {
    return activities.map((activity) => lodash.get(activity, path))
  }

  /**
   * Checks whether any element of the array is the same of any element in the set
   * @param set Set of elements
   * @param array Array of elements
   * @returns Boolean
   */
  private static isJoin(set: Set<any>, array: Array<any>): boolean {
    const arrayToSet = new Set(array)
    return new Set([...set, ...arrayToSet]).size !== set.size + arrayToSet.size
  }

  /**
   * Get the Superface usecase for the given endpoint with its main argument
   * @param stream The stream we are currently targeting
   * @param profileId The ID of the profile we are getting data for
   * @returns The function to call, as well as its main argument
   */
  private static getSuperfaceUsecase(
    stream: string,
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
    switch (stream) {
      case 'followers':
        return { fn: getFollowers, arg: profileId }
      case 'mentions':
        return { fn: findPostsByMention, arg: profileId }
      default: {
        const hashtag = stream.includes('#')
          ? stream.slice(stream.indexOf('#') + 1)
          : stream.slice(stream.indexOf('/') + 1)
        return { fn: findPostsByHashtag, arg: hashtag }
      }
    }
  }

  public static async refreshToken(context: IStepContext): Promise<void> {
    const superface = IntegrationServiceBase.superfaceClient()
    const profile = await superface.getProfile('oauth2/refresh-token')
    const profileWithNewTokens: any = (
      await profile.getUseCase('GetAccessTokenFromRefreshToken').perform({
        refreshToken: context.integration.refreshToken,
        clientId: TWITTER_CONFIG.clientId,
        clientSecret: TWITTER_CONFIG.clientSecret,
      })
    ).unwrap()

    context.integration.refreshToken = profileWithNewTokens.refreshToken
    context.integration.token = profileWithNewTokens.accessToken

    context.pipelineData = {
      ...context.pipelineData,
      superface,
      profileId: context.integration.integrationIdentifier,
    }
  }
}
