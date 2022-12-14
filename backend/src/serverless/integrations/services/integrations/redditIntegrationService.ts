import sanitizeHtml from 'sanitize-html'
import he from 'he'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { RedditMemberAttributes } from '../../../../database/attributes/member/reddit'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import { RedditActivityType } from '../../../../types/activityTypes'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
  IStreamResultOperation,
} from '../../../../types/integration/stepResult'
import { IntegrationType, PlatformType } from '../../../../types/integrationEnums'
import Operations from '../../../dbOperations/operations'
import getPosts from '../../usecases/reddit/getPosts'
import getComments from '../../usecases/reddit/getComments'
import { RedditGrid } from '../../grid/redditGrid'
import {
  RedditCommentsResponse,
  RedditPostsResponse,
  RedditPost,
  RedditIntegrationSettings,
  RedditComment,
  RedditMoreChildren,
  RedditMoreCommentsResponse,
} from '../../types/redditTypes'
import { AddActivitiesSingle } from '../../types/messageTypes'

import { IntegrationServiceBase } from '../integrationServiceBase'
import { Logger } from '../../../../utils/logging'
import getMoreComments from '../../usecases/reddit/getMoreComments'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class RedditIntegrationService extends IntegrationServiceBase {
  static maxRetrospect: number = 2 * 3600

  constructor() {
    super(IntegrationType.REDDIT, 60)
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.serviceContext)
    await service.createPredefined(RedditMemberAttributes)
  }

  /**
   * Set up the pipeline data that will be needed throughout the processing.
   * @param context context passed along worker messages
   */
  async preprocess(context: IStepContext): Promise<void> {
    const settings = context.integration.settings as RedditIntegrationSettings
    context.pipelineData = {
      subreddits: settings.subreddits,
      pizzlyId: `${context.integration.tenantId}-${PlatformType.REDDIT}`,
    }
  }

  /**
   * Get the streams to process. In this case, we need one initial stream per subreddit
   * @param context context passed along worker messages
   * @returns an array of streams to process
   */
  async getStreams(context: IStepContext): Promise<IIntegrationStream[]> {
    return context.pipelineData.subreddits.map((subreddit: string) => ({
      value: `subreddit:${subreddit}`,
      metadata: {
        channel: subreddit,
      },
    }))
  }

  /**
   * Process a stream. It detects the type of stream we have and call the appropiate function
   * @param stream the full stream information
   * @param context context passed along worker messages
   * @returns the processed stream results
   */
  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const logger: Logger = this.logger(context)
    let newStreams: IIntegrationStream[]

    switch (stream.value.split(':')[0]) {
      case 'subreddit':
        return this.subRedditStream(stream, context, logger)
      case 'comments':
        return this.commentsStream(stream, context, logger)
      default:
        return this.moreCommentsStream(stream, context, logger)
    }
  }

  /**
   * Process a stream of type subreddit. It will fetch the posts for the subreddit and process them into crowd.dev activities.
   * If there is a new page of posts, it will add it as the nextPageStream.
   * For each post, it will create a new stream to fetch its comments.
   * @param stream the full stream information
   * @param context context passed along worker messages
   * @param logger a logger instance for structured logging
   * @returns the processed stream results
   */
  async subRedditStream(
    stream: IIntegrationStream,
    context: IStepContext,
    logger: Logger,
  ): Promise<IProcessStreamResults> {
    const subreddit = stream.value.split(':')[1]
    const pizzlyId = context.pipelineData.pizzlyId
    const after = stream.metadata.after
    const response: RedditPostsResponse = await getPosts({ subreddit, pizzlyId, after }, logger)

    const posts = response.data.children

    if ((posts.length as any) === 0) {
      return {
        operations: [],
        lastRecord: undefined,
        lastRecordTimestamp: undefined,
        // sleep: 1.5,
        newStreams: [],
      }
    }
    // The marker for the next page is always the name of the last post
    const nextPage = posts[posts.length - 1].data.name

    const activities = posts.map((post) =>
      this.parsePost(context.integration.tenantId, subreddit, post.data),
    )
    const lastRecord = activities.length > 0 ? activities[activities.length - 1] : undefined

    // If we got results, we will want to check the next page
    const nextPageStream: IIntegrationStream =
      posts.length > 0
        ? { value: stream.value, metadata: { ...(stream.metadata || {}), after: nextPage } }
        : undefined

    // For each post, we need to create a stream to get its comments
    const newStreams = posts.map((post) => ({
      value: `comments:${post.data.id}`,
      metadata: {
        channel: subreddit,
        postTitle: post.data.title,
        postUrl: post.data.url,
        postId: post.data.id,
      },
    }))

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: activities,
        },
      ],
      nextPageStream,
      lastRecord,
      lastRecordTimestamp: lastRecord ? lastRecord.timestamp.getTime() : undefined,
      // sleep: 1.5,
      newStreams,
    }
  }

  /**
   * Process a stream of type comments. It will fetch the comments on a post and parse the recursive tree into crowd.dev activities
   * It will create new streams for the tree expansions that the API returns
   * @param stream the full stream information
   * @param context context passed along worker messages
   * @param logger a logger instance for structured logging
   * @returns the processed stream results
   */
  async commentsStream(
    stream: IIntegrationStream,
    context: IStepContext,
    logger: Logger,
  ): Promise<IProcessStreamResults> {
    const subreddit = stream.metadata.channel
    const postId = stream.value.split(':')[1]
    const pizzlyId = context.pipelineData.pizzlyId

    const response: RedditCommentsResponse = await getComments(
      { subreddit, pizzlyId, postId },
      logger,
    )

    const comments = response[1].data.children

    let activities = []
    let newStreams = []

    for (const comment of comments) {
      // For each comment, we are using the recursive comment parser to get a list of activities and new streams (list of commentIds to expand)
      const commentOut = this.recursiveCommentParser(
        comment.kind,
        comment.data,
        postId,
        stream,
        context,
        logger,
      )
      activities = activities.concat(commentOut.activities)
      newStreams = newStreams.concat(commentOut.newStreams)
    }

    if ((comments.length as any) === 0) {
      return {
        operations: [],
        lastRecord: undefined,
        lastRecordTimestamp: undefined,
        // sleep: 1.5,
        newStreams: [],
      }
    }
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
      // sleep: 1.5,
      newStreams,
    }
  }

  /**
   * Process a stream of type morecomments. It will expand the comments that are left to expand from the comment tree.
   * @param stream the full stream information
   * @param context context passed along worker messages
   * @param logger a logger instance for structured logging
   * @returns the processed stream results
   */
  async moreCommentsStream(
    stream: IIntegrationStream,
    context: IStepContext,
    logger: Logger,
  ): Promise<IProcessStreamResults> {
    const postId = stream.metadata.postId
    const sourceParentId = stream.metadata.sourceParentId
    const children = stream.metadata.children
    const pizzlyId = context.pipelineData.pizzlyId

    const response: RedditMoreCommentsResponse = await getMoreComments(
      { postId, pizzlyId, children },
      logger,
    )

    const comments = response.json.data.things

    let activities = []
    let newStreams = []

    for (const comment of comments) {
      // For each expanded comment in the response, we are using the recursive comment parser to get a list of activities and new streams (list of more comment IDs to expand)
      const commentOut = this.recursiveCommentParser(
        comment.kind,
        comment.data,
        sourceParentId,
        stream,
        context,
        logger,
      )
      activities = activities.concat(commentOut.activities)
      newStreams = newStreams.concat(commentOut.newStreams)
    }

    if ((comments.length as any) === 0) {
      return {
        operations: [],
        lastRecord: undefined,
        lastRecordTimestamp: undefined,
        // sleep: 1.5,
        newStreams: [],
      }
    }
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
      // sleep: 1.5,
      newStreams,
    }
  }

  /**
   * Recursively parse a comment.
   * - If the comment is of type 'more', we need to create a new stream with all the IDs to expand
   * - Otherwise, add the comment to the activities output, and recurse its replies doing the same procedure
   * @param kind type of data, it will mark whether we have a comment, or a list of IDs to expand later
   * @param comment the comment to parse
   * @param sourceParentId the ID of the parent comment
   * @param stream full stream information
   * @param context full context information
   * @param logger a logger instance for structured logging
   * @returns a list of the comment and all the nested replies parsed as crowd.dev activities, and a list of new streams, which are comment IDs left to expand.
   */
  recursiveCommentParser(
    kind: string,
    comment: RedditComment | RedditMoreChildren,
    sourceParentId: string,
    stream: IIntegrationStream,
    context: IStepContext,
    logger: Logger,
  ): { activities: AddActivitiesSingle[]; newStreams: IIntegrationStream[] } {
    const out = { activities: [], newStreams: [] }

    // If the kind is 'more', instead of a comment we have a list of comment IDs to expand. We need to create streams for those and return them.
    if (kind === 'more') {
      comment = comment as RedditMoreChildren

      // Split list into chunks of 99
      function* chunks<T>(arr: T[], n: number): Generator<T[], void> {
        for (let i = 0; i < arr.length; i += n) {
          yield arr.slice(i, i + n)
        }
      }

      // Each stream has at most 99 children to expand. If there are more, we make more than one stream.
      for (const chunk of [...chunks(comment.children, 99)]) {
        out.newStreams.push({
          value: `comments:${stream.metadata.postId}`,
          metadata: {
            ...stream.metadata,
            sourceParentId,
            children: chunk,
          },
        })
      }

      return out
    }

    // Otherwise, we have a proper comment
    comment = comment as RedditComment

    // Parse the comment into an activity and append to the output
    out.activities.push(
      this.parseComment(
        context.integration.tenantId,
        stream.metadata.channel,
        comment,
        sourceParentId,
        stream,
      ),
    )

    if (!comment.replies) {
      return out
    } else {
      const repliesWrapped = comment.replies.data.children as any

      // For each reply, we need to recurse to get it parsed either as an activity or a new stream
      for (const replyWrapped of repliesWrapped) {
        const reply: RedditComment = replyWrapped.data
        const { activities, newStreams } = this.recursiveCommentParser(
          replyWrapped.kind,
          reply,
          comment.id,
          stream,
          context,
          logger,
        )

        // Concatenate the outputs
        out.activities = out.activities.concat(activities)
        out.newStreams = out.newStreams.concat(newStreams)
      }
      return out
    }
  }

  /**
   * Parse a post from the reddit API into a crowd.dev activity
   * @param tenantId the tenant ID
   * @param channel the channel (subreddit) we are parsing
   * @param post the post from the Reddit API
   * @returns a post parsed as a crowd.dev activity
   */
  parsePost(tenantId, channel, post: RedditPost): AddActivitiesSingle {
    const body = post.selftext_html
      ? sanitizeHtml(he.decode(post.selftext_html))
      : `<a href="${post.url}" target="__blank">${post.url}</a>`
    const activity = {
      tenant: tenantId,
      sourceId: post.id.toString(),
      type: RedditActivityType.POST,
      platform: PlatformType.REDDIT,
      timestamp: new Date(post.created * 1000),
      body,
      title: post.title,
      url: `https://www.reddit.com${post.permalink}`,
      channel,
      score: RedditGrid[RedditActivityType.POST].score,
      isKeyAction: RedditGrid[RedditActivityType.POST].isKeyAction,
      attributes: {
        url: post.url,
        name: post.name,
        downs: post.downs,
        ups: post.ups,
        upvoteRatio: post.upvote_ratio,
        thubmnail: post.thumbnail,
      },
    }
    return {
      ...activity,
      member: this.getMember(post),
    }
  }

  /**
   * Parse a comment from the reddit API into a crowd.dev activity
   * @param tenantId the tenant ID
   * @param channel the channel (subreddit) we are parsing
   * @param comment the comment from the Reddit API
   * @param sourceParentId the ID in Reddit of the parent comment or post
   * @returns a comment parsed as a crowd.dev activity
   */
  parseComment(
    tenantId,
    channel,
    comment: RedditComment,
    sourceParentId: string,
    stream: IIntegrationStream,
  ): AddActivitiesSingle {
    const activity = {
      tenant: tenantId,
      sourceId: comment.id.toString(),
      type: RedditActivityType.COMMENT,
      platform: PlatformType.REDDIT,
      timestamp: new Date(comment.created * 1000),
      sourceParentId,
      body: sanitizeHtml(he.decode(comment.body_html)),
      title: comment.title,
      url: `https://www.reddit.com${comment.permalink}`,
      channel,
      score: RedditGrid[RedditActivityType.COMMENT].score,
      isKeyAction: RedditGrid[RedditActivityType.COMMENT].isKeyAction,
      attributes: {
        url: comment.url,
        name: comment.name,
        postUrl: stream.metadata.postUrl,
        postTitle: stream.metadata.postTitle,
        postId: stream.metadata.postId,
        downs: comment.downs,
        ups: comment.ups,
        upvoteRatio: comment.upvote_ratio,
        thubmnail: comment.thumbnail,
      },
    }
    return {
      ...activity,
      member: this.getMember(comment),
    }
  }

  /**
   * Parse the relevant fields of a post or a comment into a community member
   * @param activity either a post or a comment
   * @returns a crowd.dev community member
   */
  getMember(activity) {
    if (activity.author === '[deleted]') {
      return {
        username: 'deleted',
        displayName: 'Deleted User',
      }
    }
    return {
      username: activity.author,
      platform: PlatformType.REDDIT,
      displayName: activity.author,
      attributes: {
        [MemberAttributeName.SOURCE_ID]: {
          [PlatformType.REDDIT]: activity.author_fullname,
        },
        [MemberAttributeName.URL]: {
          [PlatformType.REDDIT]: `https://www.reddit.com/user/${activity.author}`,
        },
      },
    }
  }

  /**
   * Detect whether processing should stop.
   * When we are parsing subreddits, and we are not in onboarding mode, we only want to go two hours back.
   * Otherwise, we parse the whole thing.
   * This function will never be called in onboarding mode
   * @param context the full pipeline context
   * @param currentStream the current stream
   * @param lastOperations n/a
   * @param lastRecord n/a
   * @param lastRecordTimestamp the timestamp of the last record we fetched
   * @returns whether processing should stop
   */
  async isProcessingFinished(
    context: IStepContext,
    currentStream: IIntegrationStream,
    lastOperations: IStreamResultOperation[],
    lastRecord?: any,
    lastRecordTimestamp?: number,
  ): Promise<boolean> {
    switch (currentStream.value.split(':')[0]) {
      case 'subreddit':
        return IntegrationServiceBase.isRetrospectOver(
          lastRecordTimestamp,
          context.startTimestamp,
          RedditIntegrationService.maxRetrospect,
        )

      default:
        return false
    }
  }
}
