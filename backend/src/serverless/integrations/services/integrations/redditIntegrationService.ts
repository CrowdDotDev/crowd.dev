import sanitizeHtml from 'sanitize-html'
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
  constructor() {
    super(IntegrationType.REDDIT, 2 * 60)
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.serviceContext)

    await service.createPredefined(RedditMemberAttributes)
  }

  async preprocess(context: IStepContext): Promise<void> {
    const settings = context.integration.settings as RedditIntegrationSettings
    context.pipelineData = {
      subreddits: settings.subreddits,
      pizzlyId: `${context.integration.tenantId}-${PlatformType.REDDIT}`,
    }
  }

  async getStreams(context: IStepContext): Promise<IIntegrationStream[]> {
    return context.pipelineData.subreddits.map((subreddit: string) => ({
      value: `subreddit:${subreddit}`,
      metadata: {
        channel: subreddit,
      },
    }))
  }

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
    const nextPage = posts[posts.length - 1].data.name

    const activities = posts.map((post) =>
      this.parsePost(context.integration.tenantId, subreddit, post.data),
    )
    const lastRecord = activities.length > 0 ? activities[activities.length - 1] : undefined

    const nextPageStream: IIntegrationStream =
      posts.length > 0
        ? { value: stream.value, metadata: { ...(stream.metadata || {}), after: nextPage } }
        : undefined
    
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

  commentsHelper(
    kind: string,
    comment: RedditComment | RedditMoreChildren,
    sourceParentId: string,
    stream: IIntegrationStream,
    context: IStepContext,
    logger: Logger,
  ): { activities: AddActivitiesSingle[]; newStreams: IIntegrationStream[] } {

    const out = { activities: [], newStreams: [] }

    if (kind === 'more') {
      comment = comment as RedditMoreChildren

      // Split list into chunks of 99
      function* chunks<T>(arr: T[], n: number): Generator<T[], void> {
        for (let i = 0; i < arr.length; i += n) {
          yield arr.slice(i, i + n);
        }
      }

      for (const chunk of [...chunks(comment.children, 99)]) {
        out.newStreams.push({
          value: `comments:${stream.metadata.postId}`,
          metadata: {
            ...stream.metadata,
            sourceParentId,
            children: chunk,
          }
        })
      }

      return out
    }

    comment = comment as RedditComment
    out.activities.push(this.parseComment(context.integration.tenantId, stream.metadata.channel, comment, sourceParentId, stream))

    if (!comment.replies) {
      return out
    } else {
      const repliesWrapped = comment.replies.data.children as any
      for (const replyWrapped of repliesWrapped) {
        const reply: RedditComment = replyWrapped.data
        const { activities, newStreams } = this.commentsHelper(replyWrapped.kind, reply, comment.id, stream, context, logger)
        out.activities = out.activities.concat(activities)
        out.newStreams = out.newStreams.concat(newStreams)
      }
      return out
    }
  }

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
      const commentOut = this.commentsHelper(comment.kind, comment.data, postId, stream, context, logger)
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

  async moreCommentsStream(
    stream: IIntegrationStream,
    context: IStepContext,
    logger: Logger,
  ): Promise<IProcessStreamResults> {
    const linkId = stream.metadata.linkId
    const sourceParentId = stream.metadata.sourceParentId
    const children = stream.metadata.children
    const pizzlyId = context.pipelineData.pizzlyId

    const response: RedditMoreCommentsResponse = await getMoreComments(
      { linkId, pizzlyId, children },
      logger,
    )

    const comments = response.json.data.things

    let activities = []
    let newStreams = []

    for (const comment of comments) {
      const commentOut = this.commentsHelper(comment.kind, comment.data, sourceParentId, stream, context, logger)
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

  parsePost(tenantId, channel, post: RedditPost): AddActivitiesSingle {
    const body = post.selftext_html
      ? sanitizeHtml(post.selftext_html)
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

  parseComment(tenantId, channel, comment: RedditComment, sourceParentId: string, stream: IIntegrationStream): AddActivitiesSingle {
    const activity = {
      tenant: tenantId,
      sourceId: comment.id.toString(),
      type: RedditActivityType.COMMENT,
      platform: PlatformType.REDDIT,
      timestamp: new Date(comment.created * 1000),
      sourceParentId,
      body: sanitizeHtml(comment.body_html),
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
  // async isProcessingFinished(
  //   context: IStepContext,
  //   currentStream: IIntegrationStream,
  //   lastOperations: IStreamResultOperation[],
  //   lastRecord?: any,
  //   lastRecordTimestamp?: number,
  // ): Promise<boolean> {
  //   switch (currentStream.value) {
  //     case 'members':
  //       if (lastRecord === undefined) return true

  //       return lastRecord.sourceId in context.pipelineData.members
  //     case 'threads':
  //       if ((currentStream.metadata as Thread).new) {
  //         return false
  //       }

  //       if (lastRecordTimestamp === undefined) return true

  //       return IntegrationServiceBase.isRetrospectOver(
  //         lastRecordTimestamp,
  //         context.startTimestamp,
  //         SlackIntegrationService.maxRetrospect,
  //       )

  //     default:
  //       if (context.pipelineData.channelsInfo[currentStream.value].new) {
  //         return false
  //       }

  //       if (lastRecordTimestamp === undefined) return true

  //       return IntegrationServiceBase.isRetrospectOver(
  //         lastRecordTimestamp,
  //         context.startTimestamp,
  //         SlackIntegrationService.maxRetrospect,
  //       )
  //   }
  // }
}
