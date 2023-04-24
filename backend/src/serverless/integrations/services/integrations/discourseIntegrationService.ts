import sanitizeHtml from 'sanitize-html'
import he from 'he'
import moment from 'moment/moment'
import { IntegrationServiceBase } from '../integrationServiceBase'
import { IntegrationType, PlatformType } from '../../../../types/integrationEnums'
import {
  IIntegrationStream,
  IPendingStream,
  IProcessStreamResults,
  IStepContext,
} from '../../../../types/integration/stepResult'
import {
  DiscourseConnectionParams,
  DiscourseCategoryResponse,
  DiscourseTopicResponse,
  DiscourseTopicsInput,
  DiscoursePostsInput,
  DiscoursePostsFromTopicResponse,
  DiscoursePostsByIdsInput,
  DiscoursePostsByIdsResponse
} from '../../types/discourseTypes'
import { getDiscourseCategories } from '../../usecases/discourse/getCategories'
import { getDiscourseTopics } from '../../usecases/discourse/getTopics'
import { getDiscoursePostsFromTopic } from '../../usecases/discourse/getPostsFromTopic'
import { getDiscoursePostsByIds } from '../../usecases/discourse/getPostsByIds'
import { getDiscourseUserByUsername } from '../../usecases/discourse/getUser'
import { AddActivitiesSingle, Member } from '../../types/messageTypes'
import Operations from '../../../dbOperations/operations'
import { DiscourseMemberAttributes } from '../../../../database/attributes/member/discourse'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { DiscourseActivityType } from '../../../../types/activityTypes'
import { DiscourseGrid } from '../../grid/discourseGrid'

enum DiscourseStreamType {
  CATEGORIES = 'categories',
  TOPICS_FROM_CATEGORY = 'topicsFromCategory',
  POSTS_FROM_TOPIC = 'postsFromTopic',
  POSTS_BY_IDS = 'postsByIds',
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
    await service.createPredefined(DiscourseMemberAttributes)
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
          const user = await getDiscourseUserByUsername(
            {
              forumHostname: context.pipelineData.forumHostname,
              apiKey: context.pipelineData.apiKey,
              apiUsername: context.pipelineData.apiUsername,
            },
            { username: post.username },
            context.logger,
          )

          const member: Member = {
            username: {
              [PlatformType.DISCOURSE]: post.username,
            },
            displayName: user.user.name,
            attributes: {
              [MemberAttributeName.URL]: {
                [PlatformType.DISCOURSE]: `https://${context.pipelineData.forumHostname}/u/${post.username}`,
              },
              [MemberAttributeName.WEBSITE_URL]: {
                [PlatformType.DISCOURSE]: user.user.website || '',
              },
              [MemberAttributeName.LOCATION]: {
                [PlatformType.DISCOURSE]: user.user.location || '',
              },
              [MemberAttributeName.BIO]: {
                [PlatformType.DISCOURSE]: sanitizeHtml(he.decode(user.user.bio_cooked)) || '',
              },
              [MemberAttributeName.AVATAR_URL]: {
                [PlatformType.DISCOURSE]:
                  `https://${context.pipelineData.forumHostname}${user.user.avatar_template.replace(
                    '{size}',
                    '200',
                  )}` || '',
              },
            },
            emails: user.user.email ? [user.user.email] : [],
          }
          
          const activity: AddActivitiesSingle = {
            member,
            platform: PlatformType.DISCOURSE,
            tenant: context.integration.tenantId,
            sourceId: `${post.id}`,
            sourceParentId: lastIdInPreviousBatch || null,
            type: post.post_number === 1 ? DiscourseActivityType.POST : DiscourseActivityType.REPLY,
            timestamp: moment(post.created_at).utc().toDate(),
            body: sanitizeHtml(he.decode(post.cooked)),
            title: post.post_number === 1 ? stream.metadata.topicTitle : null,
            url: `https://${context.pipelineData.forumHostname}/t/${stream.metadata.topicSlug}/${topicId}/${post.post_number}`,
            score: post.post_number === 1 ? DiscourseGrid[DiscourseActivityType.POST].score : DiscourseGrid[DiscourseActivityType.REPLY].score,
            isContribution: post.post_number === 1 ? DiscourseGrid[DiscourseActivityType.POST].isContribution : DiscourseGrid[DiscourseActivityType.REPLY].isContribution,
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
}
