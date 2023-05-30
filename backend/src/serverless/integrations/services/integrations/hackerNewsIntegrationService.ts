import sanitizeHtml from 'sanitize-html'
import moment from 'moment'
import { HackerNewsActivityType, HACKERNEWS_GRID } from '@crowd/integrations'
import { IntegrationType, PlatformType } from '@crowd/types'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { HackerNewsMemberAttributes } from '../../../../database/attributes/member/hackerNews'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import {
  IIntegrationStream,
  IPendingStream,
  IProcessStreamResults,
  IStepContext,
} from '../../../../types/integration/stepResult'
import Operations from '../../../dbOperations/operations'
import getPost from '../../usecases/hackerNews/getPost'
import {
  HackerNewsResponse,
  HackerNewsIntegrationSettings,
  HackerNewsSearchResult,
} from '../../types/hackerNewsTypes'
import { AddActivitiesSingle, Member, PlatformIdentities } from '../../types/messageTypes'
import getPostsByKeywords from '../../usecases/hackerNews/getPostsByKeywords'

import { IntegrationServiceBase } from '../integrationServiceBase'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class HackerNewsIntegrationService extends IntegrationServiceBase {
  constructor() {
    super(IntegrationType.HACKER_NEWS, 2 * 60)
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.serviceContext)

    await service.createPredefined(HackerNewsMemberAttributes)
  }

  async preprocess(context: IStepContext): Promise<void> {
    const settings = context.integration.settings as HackerNewsIntegrationSettings

    const keywords = Array.from(new Set([...settings.keywords, ...settings.urls]))
    context.logger.info(`Fetching posts for keywords: ${keywords}`)
    const posts = await getPostsByKeywords(
      {
        keywords,
        after: context.onboarding ? 0 : moment().subtract(30, 'days').unix(),
      },
      context.serviceContext,
      context.logger,
    )

    context.pipelineData = {
      keywords,
      posts,
    }
  }

  async getStreams(context: IStepContext): Promise<IPendingStream[]> {
    return context.pipelineData.posts.map((a: HackerNewsSearchResult) => ({
      value: a.postId,
      metadata: {
        channel: a.keywords[0],
      },
    }))
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    let newStreams: IPendingStream[]

    const post: HackerNewsResponse = await getPost(stream.value, context.logger)

    if (post.kids !== undefined) {
      newStreams = post.kids.map((a: number) => ({
        value: a.toString(),
        metadata: {
          ...stream.metadata,
          ...((!post.parent && {
            parentId: post.id.toString(),
            parentTitle: post.title || post.text,
          }) ||
            {}),
        },
      }))
    }

    let activities: AddActivitiesSingle[]
    if (!post.text && !post.url) {
      activities = []
    } else {
      const parsedPost = this.parsePost(
        context.integration.tenantId,
        stream.metadata.channel,
        post,
        stream.metadata.parentId,
        stream.metadata.parentTitle,
        context,
      )
      activities = [parsedPost]
    }

    const lastRecord = activities.length > 0 ? activities[activities.length - 1] : undefined

    let sleep: number | undefined

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: activities,
        },
      ],
      lastRecord,
      lastRecordTimestamp: lastRecord ? lastRecord.timestamp.getTime() : undefined,
      sleep,
      newStreams,
    }
  }

  parsePost(
    tenantId,
    channel,
    post: HackerNewsResponse,
    parentId,
    parentTitle,
    context: IStepContext,
  ): AddActivitiesSingle {
    const type = post.parent ? HackerNewsActivityType.COMMENT : HackerNewsActivityType.POST
    const url = `https://news.ycombinator.com/item?id=${post.parent ? post.parent : post.id}`
    const body =
      post.text !== undefined && post.text !== ''
        ? sanitizeHtml(post.text)
        : `<a href="${post.url}" target="_blank">${post.url}</a>`
    const activity = {
      username: post.user.id,
      tenant: tenantId,
      sourceId: post.id.toString(),
      ...(post.parent && { sourceParentId: post.parent.toString() }),
      type,
      platform: PlatformType.HACKERNEWS,
      timestamp: new Date(post.time * 1000),
      body,
      title: post.title,
      url,
      channel,
      score: HACKERNEWS_GRID[type].score,
      isContribution: HACKERNEWS_GRID[type].isContribution,
      attributes: {
        commentsCount: post.descendants,
        destinationUrl: post.url,
        score: post.score,
        ...(post.parent && {
          parentUrl: `https://news.ycombinator.com/item?id=${parentId}`,
          parentTitle,
        }),
        type: post.type,
      },
    }

    const member: Member = {
      username: {
        [PlatformType.HACKERNEWS]: {
          username: post.user.id,
          integrationId: context.integration.id,
        },
      } as PlatformIdentities,
      displayName: post.user.id,
      attributes: {
        [MemberAttributeName.SOURCE_ID]: {
          [PlatformType.HACKERNEWS]: post.user.id,
        },
        [MemberAttributeName.KARMA]: {
          [PlatformType.HACKERNEWS]: post.user.karma,
        },
        [MemberAttributeName.BIO]: {
          [PlatformType.HACKERNEWS]: post.user.about,
        },
      },
    }
    return {
      ...activity,
      member,
    }
  }
}
