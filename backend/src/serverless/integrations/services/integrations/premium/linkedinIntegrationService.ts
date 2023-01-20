import sanitizeHtml from 'sanitize-html'
import { getAllCommentComments } from '../../../usecases/linkedin/getCommentComments'
import { LinkedInGrid } from '../../../grid/linkedinGrid'
import { MemberAttributeName } from '../../../../../database/attributes/member/enums'
import { LinkedInMemberAttributes } from '../../../../../database/attributes/member/linkedin'
import MemberAttributeSettingsService from '../../../../../services/memberAttributeSettingsService'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
} from '../../../../../types/integration/stepResult'
import { IntegrationType, PlatformType } from '../../../../../types/integrationEnums'
import { ILinkedInOrganizationPost } from '../../../types/linkedinTypes'
import { AddActivitiesSingle, Member } from '../../../types/messageTypes'
import { getMember } from '../../../usecases/linkedin/getMember'
import { getOrganization } from '../../../usecases/linkedin/getOrganization'
import { getAllOrganizationPosts } from '../../../usecases/linkedin/getOrganizationPosts'
import { getAllPostComments } from '../../../usecases/linkedin/getPostComments'
import { IntegrationServiceBase } from '../../integrationServiceBase'
import Operations from '../../../../dbOperations/operations'
import { getAllPostReactions } from '../../../usecases/linkedin/getPostReactions'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class LinkedinIntegrationService extends IntegrationServiceBase {
  constructor() {
    super(IntegrationType.LINKEDIN, 20)
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.serviceContext)
    await service.createPredefined(LinkedInMemberAttributes)
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
    log.debug({ stream: stream.value, metadata: stream.metadata }, 'Processing stream!')

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

  private async processCommentComments(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const log = this.logger(context)

    const comments = await getAllCommentComments(
      context.pipelineData.pizzlyId,
      stream.metadata.urnId,
      log,
    )

    const activities: AddActivitiesSingle[] = []

    for (const comment of comments) {
      const member = await this.parseMember(comment.authorUrn, context)

      activities.push({
        tenant: context.integration.tenantId,
        platform: PlatformType.LINKEDIN,
        type: 'comment',
        timestamp: new Date(comment.timestamp),
        sourceId: comment.urnId,
        sourceParentId: stream.metadata.urnId,
        body: sanitizeHtml(comment.comment),
        url: `https://www.linkedin.com/feed/update/${encodeURIComponent(
          comment.objectUrn,
        )}?commentUrn=${encodeURIComponent(
          comment.parentUrnId.replace('urn:li:activity:', 'activity:'),
        )}&replyUrn=${encodeURIComponent(comment.urnId.replace('urn:li:activity:', 'activity:'))}`,
        attributes: {
          userUrl: !LinkedinIntegrationService.isPrivateMember(member)
            ? member.attributes[MemberAttributeName.URL][PlatformType.LINKEDIN]
            : undefined,
          postUrl: `https://www.linkedin.com/feed/update/${encodeURIComponent(
            stream.metadata.postUrnId,
          )}`,
          postBody: stream.metadata.postBody,
        },
        member,
        score: LinkedInGrid.comment.score,
        isKeyAction: LinkedInGrid.comment.isKeyAction,
      })

      if (comment.childComments > 0) {
        throw new Error('LinkedIn only has one level of comments!')
      }
    }

    if (activities.length > 0) {
      const lastRecord = activities[activities.length - 1]
      return {
        operations: [
          {
            type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
            records: activities,
          },
        ],
        lastRecord,
        lastRecordTimestamp: lastRecord.timestamp.getTime(),
      }
    }

    return {
      operations: [],
    }
  }

  private async processPostReactions(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const log = this.logger(context)

    const reactions = await getAllPostReactions(
      context.pipelineData.pizzlyId,
      stream.metadata.urnId,
      log,
    )

    const activities: AddActivitiesSingle[] = []

    for (const reaction of reactions) {
      const member = await this.parseMember(reaction.authorUrn, context)
      activities.push({
        tenant: context.integration.tenantId,
        platform: PlatformType.LINKEDIN,
        type: 'reaction',
        timestamp: new Date(reaction.timestamp),
        sourceId: `${stream.metadata.urnId}:${reaction.reaction}:${reaction.authorUrn}`,
        url: `https://www.linkedin.com/feed/update/${encodeURIComponent(stream.metadata.urnId)}`,
        attributes: {
          userUrl: !LinkedinIntegrationService.isPrivateMember(member)
            ? member.attributes[MemberAttributeName.URL][PlatformType.LINKEDIN]
            : undefined,
          postUrl: `https://www.linkedin.com/feed/update/${encodeURIComponent(
            stream.metadata.urnId,
          )}`,
          postBody: stream.metadata.body,
          reactionType: reaction.reaction,
        },
        member,
        score: LinkedInGrid.reaction.score,
        isKeyAction: LinkedInGrid.reaction.isKeyAction,
      })
    }

    if (activities.length > 0) {
      const lastRecord = activities[activities.length - 1]
      return {
        operations: [
          {
            type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
            records: activities,
          },
        ],
        lastRecord,
        lastRecordTimestamp: lastRecord.timestamp.getTime(),
      }
    }

    return {
      operations: [],
    }
  }

  private async processPostComments(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const log = this.logger(context)

    const comments = await getAllPostComments(
      context.pipelineData.pizzlyId,
      stream.metadata.urnId,
      log,
    )

    const activities: AddActivitiesSingle[] = []
    const newStreams: IIntegrationStream[] = []
    for (const comment of comments) {
      const member = await this.parseMember(comment.authorUrn, context)

      activities.push({
        tenant: context.integration.tenantId,
        platform: PlatformType.LINKEDIN,
        type: 'comment',
        timestamp: new Date(comment.timestamp),
        sourceId: comment.urnId,
        body: sanitizeHtml(comment.comment),
        url: `https://www.linkedin.com/feed/update/${encodeURIComponent(
          comment.objectUrn,
        )}?commentUrn=${encodeURIComponent(
          comment.urnId.replace('urn:li:activity:', 'activity:'),
        )}`,
        attributes: {
          userUrl: !LinkedinIntegrationService.isPrivateMember(member)
            ? member.attributes[MemberAttributeName.URL][PlatformType.LINKEDIN]
            : undefined,
          postUrl: `https://www.linkedin.com/feed/update/${encodeURIComponent(
            stream.metadata.urnId,
          )}`,
          postBody: stream.metadata.body,
        },
        member,
        score: LinkedInGrid.comment.score,
        isKeyAction: LinkedInGrid.comment.isKeyAction,
      })

      if (comment.childComments > 0) {
        newStreams.push({
          value: 'comment_comments',
          metadata: {
            urnId: comment.urnId,
            postUrnId: stream.metadata.urnId,
            postBody: stream.metadata.body,
          },
        })
      }
    }

    if (activities.length > 0) {
      const lastRecord = activities[activities.length - 1]
      return {
        operations: [
          {
            type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
            records: activities,
          },
        ],
        lastRecord,
        lastRecordTimestamp: lastRecord.timestamp.getTime(),
        newStreams,
      }
    }

    return {
      operations: [],
    }
  }

  private async parseMember(memberUrn: string, context: IStepContext): Promise<Member> {
    const log = this.logger(context)

    const member: Member = {
      username: {
        [PlatformType.LINKEDIN]: '',
      },
      attributes: {
        [MemberAttributeName.URL]: {
          [PlatformType.LINKEDIN]: '',
        },
        [MemberAttributeName.IS_ORGANIZATION]: {
          [PlatformType.LINKEDIN]: false,
        },
      },
    }

    if (LinkedinIntegrationService.isUser(memberUrn)) {
      const user = await getMember(
        context.pipelineData.pizzlyId,
        LinkedinIntegrationService.getUserId(memberUrn),
        log,
      )

      if (user.id === 'private') {
        member.username[PlatformType.LINKEDIN] = `private-${LinkedinIntegrationService.getUserId(
          memberUrn,
        )}`
        member.displayName = `Unknown #${LinkedinIntegrationService.getUserId(memberUrn)}`
      } else {
        member.username[PlatformType.LINKEDIN] = `${user.vanityName}`
        member.attributes[MemberAttributeName.URL][
          PlatformType.LINKEDIN
        ] = `https://www.linkedin.com/in/${user.vanityName}`
        member.displayName = `${user.firstName} ${user.lastName}`
      }
    } else if (LinkedinIntegrationService.isOrganization(memberUrn)) {
      const organization = await getOrganization(
        context.pipelineData.pizzlyId,
        LinkedinIntegrationService.getOrganizationId(memberUrn),
        log,
      )
      member.username[PlatformType.LINKEDIN] = organization.name
      member.attributes[MemberAttributeName.URL][
        PlatformType.LINKEDIN
      ] = `https://www.linkedin.com/company/${organization.vanityName}`
      member.attributes[MemberAttributeName.IS_ORGANIZATION][PlatformType.LINKEDIN] = true
    } else {
      throw new Error(`Could not determine member type from urn ${memberUrn}!`)
    }

    return member
  }

  async postprocess(
    context: IStepContext,
    failedStreams?: IIntegrationStream[],
    remainingStreams?: IIntegrationStream[],
  ): Promise<void> {
    const log = this.logger(context)
    log.info('Postprocessing')
  }

  private static isPrivateMember(member: Member): boolean {
    return member.username[PlatformType.LINKEDIN].startsWith('private-')
  }

  private static isUser(urn: string): boolean {
    return urn.startsWith('urn:li:person:')
  }

  private static isOrganization(urn: string): boolean {
    return urn.startsWith('urn:li:organization:') || urn.startsWith('urn:li:company:')
  }

  private static getUserId(urn: string): string {
    return urn.replace('urn:li:person:', '')
  }

  private static getOrganizationId(urn: string): string {
    return urn.replace('urn:li:organization:', '').replace('urn:li:company:', '')
  }
}
