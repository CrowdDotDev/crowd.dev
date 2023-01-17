import { getAllPostComments } from '../../../usecases/linkedin/getPostComments'
import { getAllOrganizationPosts } from '../../../usecases/linkedin/getOrganizationPosts'
import { PlatformType, IntegrationType } from '../../../../../types/integrationEnums'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
  IStreamResultOperation,
} from '../../../../../types/integration/stepResult'
import { IntegrationServiceBase } from '../../integrationServiceBase'
import { ILinkedInOrganizationPost } from '../../../types/linkedinTypes'
import { AddActivitiesSingle } from '../../../types/messageTypes'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class LinkedinIntegrationService extends IntegrationServiceBase {
  constructor() {
    super(IntegrationType.LINKEDIN, 20)
  }

  async preprocess(context: IStepContext): Promise<void> {
    const log = this.logger(context)
    log.info('Preprocessing!')

    const organization = context.integration.settings.organizations.find((o) => o.inUse === true)

    if (!organization) {
      throw new Error('No organization selected!')
    }

    const pizzlyId = `${context.integration.tenantId}-${PlatformType.LINKEDIN}`

    const posts = await getAllOrganizationPosts(pizzlyId, organization.organizationUrn, log)

    context.pipelineData = {
      posts,
      pizzlyId,
    }
  }

  async getStreams(context: IStepContext): Promise<IIntegrationStream[]> {
    const posts: ILinkedInOrganizationPost[] = context.pipelineData.posts

    const commentsStream = posts.map((p) => ({
      value: 'post_comments',
      metadata: p,
    }))

    const reactionsStreams = posts.map((p) => ({
      value: 'post_reactions',
      metadata: p,
    }))

    return commentsStream.concat(reactionsStreams)
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const log = this.logger(context)
    log.info({ stream: stream.value, entityId: stream.metadata.id }, 'Processing stream')

    switch (stream.value) {
      case 'post_comments':
        return this.processPostComments(stream, context)

      case 'post_reactions':
        return this.processPostReactions(stream, context)

      case 'comment_comments':
        return this.processCommentComments(stream, context)

      default:
        throw new Error(`Unknown stream ${stream.value}!`)
    }
  }

  async processCommentComments(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const log = this.logger(context)

    return undefined
  }

  async processPostReactions(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const log = this.logger(context)

    return undefined
  }

  async processPostComments(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const log = this.logger(context)

    const comments = await getAllPostComments(
      context.pipelineData.pizzlyId,
      stream.metadata.id,
      log,
    )

    const activities: AddActivitiesSingle[] = []
    for (const comment of comments) {
      const member: Member = {}
    }

    return undefined
  }

  async postprocess(
    context: IStepContext,
    failedStreams?: IIntegrationStream[],
    remainingStreams?: IIntegrationStream[],
  ): Promise<void> {
    const log = this.logger(context)
    log.info('Postprocessing')
  }

  private static isUser(id: string): boolean {
    return id.startsWith('urn:li:person:')
  }

  private static isOrganization(id: string): boolean {
    return id.startsWith('urn:li:organization:')
  }

  private static getUserId(id: string): string {
    return id.replace('urn:li:person:', '')
  }
}
