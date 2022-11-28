import sanitizeHtml from 'sanitize-html'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { HackerNewsMemberAttributes } from '../../../../database/attributes/member/hackerNews'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
} from '../../../../types/integration/stepResult'
import { IntegrationType, PlatformType } from '../../../../types/integrationEnums'
import Operations from '../../../dbOperations/operations'
import getPost from '../../usecases/hackerNews/getPost'
import { HackerNewsGrid } from '../../grid/hackerNewsGrid'
import {
  EagleEyeResponse,
  HackerNewsResponse,
  HackerNewsIntegrationSettings,
} from '../../types/hackerNewsTypes'
import { AddActivitiesSingle } from '../../types/messageTypes'
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

    const posts = await getPostsByKeywords(
      { keywords, nDays: context.onboarding ? 1000000 : 3 },
      context.serviceContext,
      this.logger(context),
    )

    context.pipelineData = {
      keywords,
      posts,
    }
  }

  async getStreams(context: IStepContext): Promise<IIntegrationStream[]> {
    return context.pipelineData.posts.map((a: EagleEyeResponse) => ({
      value: a.sourceId.slice(a.sourceId.lastIndexOf(':') + 1),
      metadata: {
        channel: a.keywords[0],
      },
    }))
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const logger = this.logger(context)
    let newStreams: IIntegrationStream[]

    const post: HackerNewsResponse = await getPost(stream.value, logger)

    if (post.kids !== undefined) {
      newStreams = post.kids.map((a: number) => ({
        value: a.toString(),
        metadata: {
          ...stream.metadata,
          ...(!post.parent && { parentId: post.id.toString(), parentTitle: post.title || post.text }) || {},
        },
      }))
    }

    let activities: AddActivitiesSingle[]
    if (!post.text && !post.url) {
      activities = []
    }
    else {
      const parsedPost = this.parsePost(context.integration.tenantId, stream.metadata.channel, post, stream.metadata.parentId, stream.metadata.parentTitle)
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

  parsePost(tenantId, channel, post: HackerNewsResponse, parentId, parentTitle): AddActivitiesSingle {
    const type = post.parent ? 'comment' : 'post'
    const url = `https://news.ycombinator.com/item?id=${post.parent ? post.parent : post.id}`
    const body =
      post.text !== undefined && post.text !== ''
        ? sanitizeHtml(post.text)
        : `<a href="${post.url}" target="_blank">${post.url}</a>`
    const activity = {
      tenant: tenantId,
      sourceId: post.id.toString(),
      ...(post.parent && { sourceParentId: post.parent.toString() }),
      type,
      platform: 'hackernews',
      timestamp: new Date(post.time * 1000),
      body,
      title: post.title,
      url,
      channel,
      score: HackerNewsGrid[type].score,
      isKeyAction: HackerNewsGrid[type].isKeyAction,
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

    const member = {
      username: post.user.id,
      platform: 'hackernews',
      displayName: post.user.id,
      attributes: {
        [MemberAttributeName.SOURCE_ID]: {
          [PlatformType.HACKERNEWS]: post.user.id,
        },
        [MemberAttributeName.KARMA]: {
          [PlatformType.HACKERNEWS]: post.user.karma,
        },
        [MemberAttributeName.LOCATION]: {
          [PlatformType.HACKERNEWS]: post.user.about,
        },
      },
    }
    return {
      ...activity,
      member: member,
    }
  }
}
