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
import { RedditGrid } from '../../grid/redditGrid'
import {
  RedditCommentsResponse,
  RedditPostsResponse,
  RedditPost,
  RedditIntegrationSettings,
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

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const logger: Logger = this.logger(context)
    let newStreams: IIntegrationStream[]

    switch (stream.value.split(':')[0]) {
      case 'subreddit':
        return this.subRedditStream(stream, context, logger)
      case 'post':
        // return this.processPost(stream, context, logger)
        newStreams = []
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
