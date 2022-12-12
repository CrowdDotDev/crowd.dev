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
} from '../../types/redditTypes'
import { AddActivitiesSingle } from '../../types/messageTypes'

import { IntegrationServiceBase } from '../integrationServiceBase'
import { Logger } from '../../../../utils/logging'

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
    // const out = context.pipelineData.subreddits.map((subreddit: string) => ({
    //   value: `subreddit:${subreddit}`,
    //   metadata: {
    //     channel: subreddit,
    //   },
    // }))
    const out = []
    out.push({
      value: 'comments:zeyn4v',
      metadata: {
        channel: 'football',
        greatParentTitle: 'The next World Cup will jump to 48 teams. Is bigger better?',
        greatParentUrl: '/r/football/comments/zeyn4v/the_next_world_cup_will_jump_to_48_teams_is/',
        greatParentId: 'zeyn4v',
      },
    })
    // out.push({
    //   value: 'comments:zgee47',
    //   metadata: {
    //     channel: 'football',
    //     greatParentTitle: 'Title here!',
    //     greatParentUrl: 'URL here!',
    //     greatParentId: 'zgee47',
    //   },
    // })
    return out
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
        sleep: 1,
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
      sleep: 1,
      newStreams: [],
    }
  }

  commentsHelper(
    kind: string,
    comment: RedditComment,
    sourceParentId: string,
    stream: IIntegrationStream,
    context: IStepContext,
    logger: Logger,
  ): { activities: AddActivitiesSingle[]; newStreams: IIntegrationStream[] } {

    const out = { activities: [], newStreams: [] }

    if (kind === 'more') {
      console.log('\n\n\n\nFOUND A MORE STREAM\n\n\n\n')
      return out
    }

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
        sleep: 1,
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
      sleep: 1,
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
        // return this.processPost(stream, context, logger)
        return this.commentsStream(stream, context, logger)
      default:
        newStreams = []
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

    const member = {
      username: post.author,
      platform: PlatformType.REDDIT,
      displayName: post.author,
      attributes: {
        [MemberAttributeName.SOURCE_ID]: {
          [PlatformType.REDDIT]: post.author_fullname,
        },
        [MemberAttributeName.URL]: {
          [PlatformType.REDDIT]: `https://www.reddit.com/user/${post.author}`,
        },
      },
    }
    return {
      ...activity,
      member,
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
        greatParentUrl: stream.metadata.greatParentUrl,
        greatParentTitle: stream.metadata.greatParentTitle,
        greatParentId: stream.metadata.greatParentId,
        downs: comment.downs,
        ups: comment.ups,
        upvoteRatio: comment.upvote_ratio,
        thubmnail: comment.thumbnail,
      },
    }
    const member = {
      username: comment.author,
      platform: PlatformType.REDDIT,
      displayName: comment.author,
      attributes: {
        [MemberAttributeName.SOURCE_ID]: {
          [PlatformType.REDDIT]: comment.author_fullname,
        },
        [MemberAttributeName.URL]: {
          [PlatformType.REDDIT]: `https://www.reddit.com/user/${comment.author}`,
        },
      },
    }
    return {
      ...activity,
      member,
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
