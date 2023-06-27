import {
  DISCOURSE_GRID,
  DISCOURSE_MEMBER_ATTRIBUTES,
  DiscourseActivityType,
} from '@crowd/integrations'
import { PlatformType, IntegrationType, MemberAttributeName } from '@crowd/types'
import he from 'he'
import moment from 'moment/moment'
import sanitizeHtml from 'sanitize-html'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import {
  IIntegrationStream,
  IPendingStream,
  IProcessStreamResults,
  IProcessWebhookResults,
  IStepContext,
} from '../../../../types/integration/stepResult'
import Operations from '../../../dbOperations/operations'
import {
  DiscourseCategoryResponse,
  DiscourseConnectionParams,
  DiscoursePostsByIdsInput,
  DiscoursePostsByIdsResponse,
  DiscoursePostsFromTopicResponse,
  DiscoursePostsInput,
  DiscourseTopicResponse,
  DiscourseTopicsInput,
  DiscourseUserResponse,
  DiscourseWebhookNotification,
  DiscourseWebhookPost,
  DiscourseWebhookUser,
} from '../../types/discourseTypes'
import type { PlatformIdentities } from '../../types/messageTypes'
import { AddActivitiesSingle, Member } from '../../types/messageTypes'
import { getDiscourseCategories } from '../../usecases/discourse/getCategories'
import { getDiscoursePostsByIds } from '../../usecases/discourse/getPostsByIds'
import { getDiscoursePostsFromTopic } from '../../usecases/discourse/getPostsFromTopic'
import { getDiscourseTopics } from '../../usecases/discourse/getTopics'
import { getDiscourseUserByUsername } from '../../usecases/discourse/getUser'
import { IntegrationServiceBase } from '../integrationServiceBase'

const BOT_USERNAMES = ['system', 'discobot']

const usernameIsBot = (username: string): boolean => BOT_USERNAMES.includes(username)

enum DiscourseStreamType {
  CATEGORIES = 'categories',
  TOPICS_FROM_CATEGORY = 'topicsFromCategory',
  POSTS_FROM_TOPIC = 'postsFromTopic',
  POSTS_BY_IDS = 'postsByIds',
}

enum DiscourseWebhookType {
  POST_CREATED = 'post_created',
  USER_CREATED = 'user_created',
  LIKED_A_POST = 'notification_created',
}

interface DiscourseProcessResult {
  type: DiscourseStreamType
  data:
    | DiscourseCategoryResponse
    | DiscourseTopicResponse
    | DiscoursePostsFromTopicResponse
    | DiscoursePostsByIdsResponse
}

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable no-case-declarations */

export class DiscourseIntegrationService extends IntegrationServiceBase {
  constructor() {
    // disable polling - new data will come trhough webhooks
    super(IntegrationType.DISCOURSE, -1)
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.repoContext)
    await service.createPredefined(DISCOURSE_MEMBER_ATTRIBUTES)
  }

  /**
   * Set up the pipeline data that will be needed throughout the processing.
   * @param context context passed along worker messages
   */
  async preprocess(context: IStepContext): Promise<void> {
    const settings = context.integration.settings
    context.pipelineData = {
      apiKey: settings.apiKey,
      apiUsername: settings.apiUsername,
      forumHostname: settings.forumHostname,
    }
  }

  async getStreams(context: IStepContext): Promise<IPendingStream[]> {
    return [
      {
        value: DiscourseStreamType.CATEGORIES,
        metadata: {
          page: '',
        },
      },
    ]
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const streamType = stream.value as DiscourseStreamType
    let result: DiscourseProcessResult
    switch (streamType) {
      case DiscourseStreamType.CATEGORIES:
        result = await DiscourseIntegrationService.processCategoriesStream(stream, context)
        break
      case DiscourseStreamType.TOPICS_FROM_CATEGORY:
        result = await DiscourseIntegrationService.processTopicsFromCategoryStream(stream, context)
        break
      case DiscourseStreamType.POSTS_FROM_TOPIC:
        result = await DiscourseIntegrationService.processPostsFromTopicStream(stream, context)
        break
      case DiscourseStreamType.POSTS_BY_IDS:
        result = await DiscourseIntegrationService.processPostsByIds(stream, context)
        break
      default:
        throw new Error(`Unknown stream type: ${streamType}`)
    }

    const newStreams: IPendingStream[] = []
    const nextPageStream: IPendingStream | undefined = undefined
    const activities: AddActivitiesSingle[] = []

    // another switch statement to handle the different types of results, helps with type safety
    switch (result.type) {
      case DiscourseStreamType.CATEGORIES:
        const data = result.data as DiscourseCategoryResponse
        data.category_list.categories.forEach((category) => {
          newStreams.push({
            value: DiscourseStreamType.TOPICS_FROM_CATEGORY,
            metadata: {
              category_id: category.id,
              category_slug: category.slug,
              page: 0,
            },
          })
        })
        break
      case DiscourseStreamType.TOPICS_FROM_CATEGORY:
        const data2 = result.data as DiscourseTopicResponse
        data2.topic_list.topics.forEach((topic) => {
          newStreams.push({
            value: DiscourseStreamType.POSTS_FROM_TOPIC,
            metadata: {
              topicId: topic.id,
              topic_slug: topic.slug,
              page: 0,
            },
          })
        })
        break
      case DiscourseStreamType.POSTS_FROM_TOPIC:
        const data3 = result.data as DiscoursePostsFromTopicResponse
        const batchSize = 100
        const postBatches: number[][] = []

        data3.post_stream.stream.forEach((postId, index) => {
          if (index % batchSize === 0) {
            postBatches.push([])
          }
          postBatches[postBatches.length - 1].push(postId)
        })

        postBatches.forEach((postBatch, index) => {
          newStreams.push({
            value: DiscourseStreamType.POSTS_BY_IDS,
            metadata: {
              topicId: data3.id,
              topicSlug: data3.slug,
              topicTitle: data3.title,
              postIds: postBatch,
              lastIdInPreviousBatch:
                index === 0 ? undefined : postBatches[index - 1][postBatches[index - 1].length - 1],
            },
          })
        })

        break
      case DiscourseStreamType.POSTS_BY_IDS:
        // no new streams to launch
        // just add the activities
        const data4 = result.data as DiscoursePostsByIdsResponse
        const { topicId, lastIdInPreviousBatch } = stream.metadata
        const posts = data4.post_stream.posts
        for (const post of posts) {
          if (usernameIsBot(post.username)) {
            /* eslint-disable no-continue */
            continue
          }
          const user = await getDiscourseUserByUsername(
            {
              forumHostname: context.pipelineData.forumHostname,
              apiKey: context.pipelineData.apiKey,
              apiUsername: context.pipelineData.apiUsername,
            },
            { username: post.username },
            context.logger,
          )

          const member = DiscourseIntegrationService.parseUserIntoMember(
            user,
            context.pipelineData.forumHostname,
            context,
          )

          const activity: AddActivitiesSingle = {
            member,
            username: member.username[PlatformType.DISCOURSE].username,
            platform: PlatformType.DISCOURSE,
            tenant: context.integration.tenantId,
            sourceId: `${topicId}-${post.post_number}`,
            sourceParentId: post.post_number === 1 ? null : `${topicId}-${post.post_number - 1}`,
            type:
              post.post_number === 1
                ? DiscourseActivityType.CREATE_TOPIC
                : DiscourseActivityType.MESSAGE_IN_TOPIC,
            timestamp: moment(post.created_at).utc().toDate(),
            body: sanitizeHtml(he.decode(post.cooked)),
            title: post.post_number === 1 ? stream.metadata.topicTitle : null,
            url: `${context.pipelineData.forumHostname}/t/${stream.metadata.topicSlug}/${topicId}/${post.post_number}`,
            channel: stream.metadata.topicTitle,
            score:
              post.post_number === 1
                ? DISCOURSE_GRID[DiscourseActivityType.CREATE_TOPIC].score
                : DISCOURSE_GRID[DiscourseActivityType.MESSAGE_IN_TOPIC].score,
            isContribution:
              post.post_number === 1
                ? DISCOURSE_GRID[DiscourseActivityType.CREATE_TOPIC].isContribution
                : DISCOURSE_GRID[DiscourseActivityType.MESSAGE_IN_TOPIC].isContribution,
          }
          activities.push(activity)
        }
        break
      default:
        throw new Error(`Unknown stream type: ${streamType}`)
    }

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: activities,
        },
      ],
      newStreams,
      nextPageStream,
    }
  }

  static async processCategoriesStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<DiscourseProcessResult> {
    const { forumHostname, apiKey, apiUsername } = context.pipelineData
    const params: DiscourseConnectionParams = {
      forumHostname,
      apiKey,
      apiUsername,
    }
    const discourseCategories = await getDiscourseCategories(params, context.logger)
    return {
      type: DiscourseStreamType.CATEGORIES,
      data: discourseCategories,
    }
  }

  static async processTopicsFromCategoryStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<DiscourseProcessResult> {
    const { forumHostname, apiKey, apiUsername } = context.pipelineData
    const params: DiscourseConnectionParams = {
      forumHostname,
      apiKey,
      apiUsername,
    }

    const input: DiscourseTopicsInput = {
      category_id: stream.metadata.category_id,
      category_slug: stream.metadata.category_slug,
      page: stream.metadata.page,
    }

    const discourseTopics = await getDiscourseTopics(params, input, context.logger)
    return {
      type: DiscourseStreamType.TOPICS_FROM_CATEGORY,
      data: discourseTopics,
    }
  }

  static async processPostsFromTopicStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<DiscourseProcessResult> {
    const { forumHostname, apiKey, apiUsername } = context.pipelineData
    const params: DiscourseConnectionParams = {
      forumHostname,
      apiKey,
      apiUsername,
    }

    const input: DiscoursePostsInput = {
      topic_slug: stream.metadata.topic_slug,
      topic_id: stream.metadata.topicId,
      page: stream.metadata.page,
    }

    const discourseTopics = await getDiscoursePostsFromTopic(params, input, context.logger)
    return {
      type: DiscourseStreamType.POSTS_FROM_TOPIC,
      data: discourseTopics,
    }
  }

  static async processPostsByIds(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<DiscourseProcessResult> {
    const { forumHostname, apiKey, apiUsername } = context.pipelineData
    const params: DiscourseConnectionParams = {
      forumHostname,
      apiKey,
      apiUsername,
    }

    const input: DiscoursePostsByIdsInput = {
      topic_id: stream.metadata.topicId,
      post_ids: stream.metadata.postIds,
    }

    const discoursePosts = await getDiscoursePostsByIds(params, input, context.logger)
    return {
      type: DiscourseStreamType.POSTS_BY_IDS,
      data: discoursePosts,
    }
  }

  async processWebhook(webhook: any, context: IStepContext): Promise<IProcessWebhookResults> {
    const { event, data } = webhook.payload

    switch (event) {
      case DiscourseWebhookType.POST_CREATED:
        return this.processPostCreatedWebhook(data as DiscourseWebhookPost, context)
      case DiscourseWebhookType.USER_CREATED:
        return this.processUserCreatedWebhook(data as DiscourseWebhookUser, context)
      case DiscourseWebhookType.LIKED_A_POST:
        const localData = data as DiscourseWebhookNotification
        if (localData.notification.notification_type === 5) {
          return this.processLikedAPostWebhook(localData, context)
        }
        break
      default:
        context.logger.warn(
          {
            event,
            data,
          },
          'No record created for event!',
        )

        return {
          operations: [],
        }
    }

    return {
      operations: [],
    }
  }

  async processPostCreatedWebhook(
    data: DiscourseWebhookPost,
    context: IStepContext,
  ): Promise<IProcessWebhookResults> {
    const post = data.post
    if (usernameIsBot(post.username)) {
      return {
        operations: [],
      }
    }
    const user = await getDiscourseUserByUsername(
      {
        forumHostname: context.integration.settings.forumHostname,
        apiKey: context.integration.settings.apiKey,
        apiUsername: context.integration.settings.apiUsername,
      },
      { username: post.username },
      context.logger,
    )

    const member = DiscourseIntegrationService.parseUserIntoMember(
      user,
      context.integration.settings.forumHostname,
      context,
    )

    const activity: AddActivitiesSingle = {
      member,
      username: member.username[PlatformType.DISCOURSE][0].username,
      platform: PlatformType.DISCOURSE,
      tenant: context.integration.tenantId,
      sourceId: `${post.topic_id}-${post.post_number}`,
      sourceParentId: post.post_number === 1 ? null : `${post.topic_id}-${post.post_number - 1}`,
      type:
        post.post_number === 1
          ? DiscourseActivityType.CREATE_TOPIC
          : DiscourseActivityType.MESSAGE_IN_TOPIC,
      timestamp: moment(post.created_at).utc().toDate(),
      body: sanitizeHtml(he.decode(post.cooked)),
      title: post.post_number === 1 ? post.topic_title : null,
      url: `${context.integration.settings.forumHostname}/t/${post.topic_slug}/${post.topic_id}/${post.post_number}`,
      channel: post.topic_title,
      score:
        post.post_number === 1
          ? DISCOURSE_GRID[DiscourseActivityType.CREATE_TOPIC].score
          : DISCOURSE_GRID[DiscourseActivityType.MESSAGE_IN_TOPIC].score,
      isContribution:
        post.post_number === 1
          ? DISCOURSE_GRID[DiscourseActivityType.CREATE_TOPIC].isContribution
          : DISCOURSE_GRID[DiscourseActivityType.MESSAGE_IN_TOPIC].isContribution,
    }

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: [activity],
        },
      ],
    }
  }

  async processUserCreatedWebhook(
    data: DiscourseWebhookUser,
    context: IStepContext,
  ): Promise<IProcessWebhookResults> {
    const user = data.user
    if (usernameIsBot(user.username)) {
      return {
        operations: [],
      }
    }
    const member = DiscourseIntegrationService.parseUserIntoMember(
      {
        user: user as any,
        user_badges: [],
        badges: [],
        badge_types: [],
        users: [],
      },
      context.integration.settings.forumHostname,
      context,
    )

    const activity: AddActivitiesSingle = {
      member,
      username: member.username[PlatformType.DISCOURSE][0].username,
      platform: PlatformType.DISCOURSE,
      tenant: context.integration.tenantId,
      sourceId: `${user.id}`,
      type: DiscourseActivityType.JOIN,
      timestamp: moment(user.created_at).utc().toDate(),
      body: null,
      title: null,
      url: `${context.integration.settings.forumHostname}/u/${user.username}`,
      channel: null,
      score: DISCOURSE_GRID[DiscourseActivityType.JOIN].score,
      isContribution: DISCOURSE_GRID[DiscourseActivityType.JOIN].isContribution,
    }

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: [activity],
        },
      ],
    }
  }

  async processLikedAPostWebhook(
    data: DiscourseWebhookNotification,
    context: IStepContext,
  ): Promise<IProcessWebhookResults> {
    const notification = data.notification
    const username = notification.data.username
      ? notification.data.username
      : notification.data.original_username
    const channel = notification.fancy_title
      ? notification.fancy_title
      : notification.data.topic_title

    if (usernameIsBot(username)) {
      return {
        operations: [],
      }
    }

    const user = await getDiscourseUserByUsername(
      {
        forumHostname: context.integration.settings.forumHostname,
        apiKey: context.integration.settings.apiKey,
        apiUsername: context.integration.settings.apiUsername,
      },
      { username },
      context.logger,
    )

    const member = DiscourseIntegrationService.parseUserIntoMember(
      user,
      context.integration.settings.forumHostname,
      context,
    )

    const activity: AddActivitiesSingle = {
      member,
      username: member.username[PlatformType.DISCOURSE][0].username,
      platform: PlatformType.DISCOURSE,
      tenant: context.integration.tenantId,
      sourceId: `${notification.id}`,
      type: DiscourseActivityType.LIKE,
      timestamp: moment(notification.created_at).utc().toDate(),
      body: null,
      title: null,
      channel,
      score: DISCOURSE_GRID[DiscourseActivityType.LIKE].score,
      isContribution: DISCOURSE_GRID[DiscourseActivityType.LIKE].isContribution,
      attributes: {
        topicURL: `${context.integration.settings.forumHostname}/t/${notification.slug}/${notification.topic_id}`,
      },
    }

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: [activity],
        },
      ],
    }
  }

  static parseUserIntoMember(
    user: DiscourseUserResponse,
    forumHostname: string,
    context: IStepContext,
  ): Member {
    return {
      username: {
        [PlatformType.DISCOURSE]: [
          {
            username: user.user.username,
            integrationId: context.integration.id,
          },
        ],
      } as PlatformIdentities,
      displayName: user.user.name,
      attributes: {
        [MemberAttributeName.URL]: {
          [PlatformType.DISCOURSE]: `${forumHostname}/u/${user.user.username}`,
        },
        [MemberAttributeName.WEBSITE_URL]: {
          [PlatformType.DISCOURSE]: user.user.website || '',
        },
        [MemberAttributeName.LOCATION]: {
          [PlatformType.DISCOURSE]: user.user.location || '',
        },
        [MemberAttributeName.BIO]: {
          [PlatformType.DISCOURSE]: user.user.bio_cooked
            ? sanitizeHtml(he.decode(user.user.bio_cooked))
            : '',
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.DISCOURSE]:
            `${forumHostname}${user.user.avatar_template.replace('{size}', '200')}` || '',
        },
      },
      emails: user.user.email ? [user.user.email] : [],
    }
  }
}
