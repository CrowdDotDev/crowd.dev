import lodash from 'lodash'
import sanitizeHtml from 'sanitize-html'
import { DevtoArticle, DevtoComment, DevtoUser } from '../usecases/devto/types'
import { single } from '../../../utils/arrays'
import { getUserById } from '../usecases/devto/getUser'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import { IRepositoryOptions } from '../../../database/repositories/IRepositoryOptions'
import Operations from '../../dbOperations/operations'
import bulkOperations from '../../dbOperations/operationsWorker'
import { DevtoGrid } from '../grid/devtoGrid'
import { BaseOutput, IntegrationResponse, parseOutput } from '../types/iteratorTypes'
import {
  AddActivitiesSingle,
  CommunityMember,
  DevtoIntegrationMessage,
} from '../types/messageTypes'
import { Endpoint, Endpoints, State } from '../types/regularTypes'
import { getArticleComments } from '../usecases/devto/getArticleComments'
import sendIntegrationsMessage from '../utils/integrationSQS'
import BaseIterator from './baseIterator'
import { PlatformType } from '../../../utils/platforms'

/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint class-methods-use-this: 0 */
export default class DevtoIterator extends BaseIterator {
  static globalLimit: number = Number(process.env.DOTENV_GLOBAL_LIMIT || Infinity)

  userContext: IRepositoryOptions

  integrationId: string

  articles: DevtoArticle[]

  constructor(
    tenant: string,
    articles: DevtoArticle[],
    userContext: IRepositoryOptions,
    integrationId: string,
    state: State = { endpoint: '', page: '' },
    onboarding: boolean = false,
  ) {
    const endpoints: Endpoints = articles.map((a) => a.id.toString())

    super(tenant, endpoints, state, onboarding, DevtoIterator.globalLimit)

    this.userContext = userContext
    this.integrationId = integrationId
    this.articles = articles
  }

  /**
   * Set full user to all relevant comments
   *
   * @param comments All comments to parse and set full user to
   * @param fullUser a user with the whole profile
   */
  static setFullUser(comments: DevtoComment[], fullUser: DevtoUser) {
    for (const comment of comments) {
      if (comment.user.user_id === fullUser.id) {
        comment.fullUser = fullUser
      }

      if (comment.children.length > 0) {
        DevtoIterator.setFullUser(comment.children, fullUser)
      }
    }
  }

  /**
   * Get all unique user ids from comments and their children
   *
   * @param comments All comments to parse
   * @returns {number[]} unique user ids
   */
  static getUserIdsFromComments(comments: DevtoComment[]): number[] {
    const userIds: number[] = comments.map((c) => c.user.user_id)
    for (const comment of comments) {
      if (comment.children.length > 0) {
        userIds.push(...DevtoIterator.getUserIdsFromComments(comment.children))
      }
    }

    return lodash.uniq(userIds)
  }

  /**
   *  Get all comments for a single Dev.to article
   * @param endpoint Article ids
   * @returns A response Object
   */
  async get(endpoint: Endpoint): Promise<IntegrationResponse> {
    // sleep just so we don't trigger some sort of hidden rate limit
    await BaseIterator.sleep(1)
    const comments = await getArticleComments(parseInt(endpoint, 10))

    // since the user profile that comes from the GET comments endpoint
    // does not contain all the user information we can get full profile and set it to comments
    const userIds: number[] = DevtoIterator.getUserIdsFromComments(comments)
    for (const userId of userIds) {
      const fullUser = await getUserById(userId)
      if (fullUser !== null) {
        DevtoIterator.setFullUser(comments, fullUser)
      }
    }

    return {
      records: comments,
      limit: -1,
      nextPage: null,
      timeUntilReset: -1,
    }
  }

  /**
   * We have an option to check for each endpoint if we are finished with it.
   * In the case of Dev.to integration an endpoint is a single article
   * and their API gives us all the comments at once with a single call, so we are always finished
   * @returns true
   */
  integrationSpecificIsEndpointFinished(): boolean {
    return true
  }

  /**
   * There is no limit in Dev.to API
   * @returns false
   */
  isLimitReached(): boolean {
    return false
  }

  async limitReachedFunction(state: State, timeUntilReset: number): Promise<BaseOutput> {
    const body: DevtoIntegrationMessage = this.getSQSBody(state, timeUntilReset)
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
  getSQSBody(state: State, timeUntilReset: number): DevtoIntegrationMessage {
    return {
      integration: PlatformType.DEVTO,
      integrationId: this.integrationId,
      state,
      tenant: this.tenant,
      sleep: timeUntilReset,
      onboarding: this.onboarding,
      args: {},
    }
  }

  /**
   *
   * @param records Map the comments from Dev.to article to activities and members records to the format of the message to add activities and members
   * @param endpoint List of records coming from the API
   * @returns List of activities and members
   */
  async parseActivitiesAndWrite(records: object[], endpoint: string): Promise<parseOutput> {
    const comments = records as DevtoComment[]
    const activities: AddActivitiesSingle[] = []

    for (const comment of comments) {
      activities.push(...this.parseComment(parseInt(endpoint, 10), comment))
    }

    if (activities.length === 0) {
      return {
        activities,
        lastRecord: {},
        numberOfRecords: 0,
      }
    }

    await bulkOperations(this.tenant, Operations.UPSERT_ACTIVITIES_WITH_MEMBERS, activities)

    return {
      activities,
      lastRecord: activities[activities.length - 1],
      numberOfRecords: activities.length,
    }
  }

  parseComment(
    articleId: number,
    comment: DevtoComment,
    parentCommentId?: string,
  ): AddActivitiesSingle[] {
    const article = single(this.articles, (a) => a.id === articleId)
    const activities: AddActivitiesSingle[] = []

    const communityMember: CommunityMember = {
      username: {
        [PlatformType.DEVTO]: comment.user.username,
      },
      crowdInfo: {
        [PlatformType.DEVTO]: {
          url: `https://dev.to/${encodeURIComponent(comment.fullUser.username)}`,
        },
      },
    }

    if (comment.user.twitter_username) {
      communityMember.crowdInfo.twitter = {
        url: `https://twitter.com/${comment.user.twitter_username}`,
      }
      communityMember.username.twitter = comment.user.twitter_username
    }

    if (comment.user.github_username) {
      communityMember.crowdInfo.github = {
        name: comment.user.name,
        url: `https://github.com/${comment.user.github_username}`,
      }
      communityMember.username.github = comment.user.github_username
    }

    if (comment.fullUser) {
      communityMember.bio = comment.fullUser?.summary || ''
      communityMember.location = comment.fullUser?.location || ''
    }

    activities.push({
      tenant: this.tenant,
      platform: PlatformType.DEVTO,
      type: 'comment',
      timestamp: new Date(comment.created_at),
      sourceId: comment.id_code,
      sourceParentId: parentCommentId,
      crowdInfo: {
        body: sanitizeHtml(comment.body_html),
        url: `https://dev.to/${encodeURIComponent(comment.fullUser.username)}/comment/${
          comment.id_code
        }`,
        thread: parentCommentId !== undefined,

        userUrl: `https://dev.to/${encodeURIComponent(comment.fullUser.username)}`,
        articleUrl: article.url,
        articleTitle: article.title,
      },
      communityMember,

      score: DevtoGrid.comment.score,
      isKeyAction: DevtoGrid.comment.isKeyAction,
    })

    for (const child of comment.children) {
      activities.push(...this.parseComment(articleId, child, comment.id_code))
    }

    return activities
  }

  async updateStatus(): Promise<void> {
    await IntegrationRepository.update(this.integrationId, { status: 'done' }, this.userContext)
  }
}
