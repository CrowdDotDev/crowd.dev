import sanitizeHtml from 'sanitize-html'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { HackerNewsMemberAttributes } from '../../../../database/attributes/member/hackerNews'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
} from '../../../../types/integration/stepResult'
import { IntegrationType } from '../../../../types/integrationEnums'
import Operations from '../../../dbOperations/operations'
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
    super(IntegrationType.HACKER_NEWS, 20)
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.serviceContext)

    await service.createPredefined(HackerNewsMemberAttributes)
  }

  async preprocess(context: IStepContext): Promise<void> {
    const settings = context.integration.settings as HackerNewsIntegrationSettings

    const posts = await getPostsByKeywords(
      { keywords: settings.keywords, nDays: context.onboarding ? 1000000 : 3 },
      context.serviceContext,
      this.logger(context),
    )

    context.pipelineData = {
      keywords: settings.keywords,
      posts,
    }
  }

  async getStreams(context: IStepContext): Promise<IIntegrationStream[]> {
    return context.pipelineData.posts.map((a: EagleEyeResponse) => ({
      value: a.sourceId.slice(a.sourceId.lastIndexOf(':') + 1),
    }))
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const logger = this.logger(context)
    let newStreams: IIntegrationStream[]

    const post: HackerNewsResponse = await getHackerNewsPost(stream.value, context)

    if (post.kids !== undefined) {
      newStreams = post.kids.map((a: number) => ({ value: a.toString() }))
    }

    const parsedPost = this.parsePost(post)

    const activities: AddActivitiesSingle[] = [parsedPost]

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
}
