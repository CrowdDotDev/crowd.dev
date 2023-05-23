import sanitizeHtml from 'sanitize-html'
import moment from 'moment'
import { LINKEDIN_GRID, LinkedinActivityType } from '@crowd/integrations'
import { getCommentComments } from '../../../usecases/linkedin/getCommentComments'
import { MemberAttributeName } from '../../../../../database/attributes/member/enums'
import { LinkedInMemberAttributes } from '../../../../../database/attributes/member/linkedin'
import MemberAttributeSettingsService from '../../../../../services/memberAttributeSettingsService'
import {
  IIntegrationStream,
  IPendingStream,
  IProcessStreamResults,
  IStepContext,
} from '../../../../../types/integration/stepResult'
import { IntegrationType, PlatformType } from '../../../../../types/integrationEnums'
import {
  ILinkedInOrganization,
  ILinkedInOrganizationPost,
  ILinkedInPostComment,
} from '../../../types/linkedinTypes'
import { AddActivitiesSingle, Member, PlatformIdentities } from '../../../types/messageTypes'
import { getMember } from '../../../usecases/linkedin/getMember'
import { getOrganization } from '../../../usecases/linkedin/getOrganization'
import { getAllOrganizationPosts } from '../../../usecases/linkedin/getOrganizationPosts'
import { getPostComments } from '../../../usecases/linkedin/getPostComments'
import { IntegrationServiceBase } from '../../integrationServiceBase'
import Operations from '../../../../dbOperations/operations'
import { getPostReactions } from '../../../usecases/linkedin/getPostReactions'
import {
  getLinkedInOrganizationId,
  getLinkedInUserId,
  isLinkedInOrganization,
  isLinkedInUser,
} from '../../../usecases/linkedin/utils'
import { RedisCache } from '../../../../../utils/redis/redisCache'
import { createRedisClient } from '../../../../../utils/redis'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class LinkedinIntegrationService extends IntegrationServiceBase {
  constructor() {
    super(IntegrationType.LINKEDIN, 60)
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.serviceContext)
    await service.createPredefined(LinkedInMemberAttributes)
  }

  async preprocess(context: IStepContext): Promise<void> {
    context.logger.info('Preprocessing!')

    const redis = await createRedisClient(true)
    const membersCache = new RedisCache('linkedin-members', redis)

    const organization: ILinkedInOrganization = context.integration.settings.organizations.find(
      (o) => o.inUse === true,
    )

    if (!organization) {
      throw new Error('No organization selected!')
    }

    const nangoId = `${context.integration.tenantId}-${PlatformType.LINKEDIN}`

    if (organization.profilePictureUrl === undefined) {
      const org = await getOrganization(nangoId, organization.id.toString(), context.logger)
      context.integration.settings.organizations = [
        ...context.integration.settings.organizations.filter((o) => o.id !== organization.id),
        {
          ...org,
          inUse: true,
        },
      ]
    }

    const posts = await getAllOrganizationPosts(
      nangoId,
      organization.organizationUrn,
      context.logger,
    )

    let cachedData = context.integration.settings.posts || []
    if (cachedData.length === 0) {
      cachedData = posts.map((p) => ({
        id: p.urnId,
      }))
    } else {
      const cachedPostsNotFound = cachedData.filter((p) => !posts.find((p2) => p2.urnId === p.id))

      cachedData = posts.map((p) => {
        const cachedPost = cachedData.find((c) => c.id === p.urnId)
        return {
          id: p.urnId,
          lastReactionTs: cachedPost?.lastReactionTs,
          lastCommentTs: cachedPost?.lastReactionTs,
        }
      })

      if (cachedPostsNotFound.length > 0) {
        cachedData.push(...cachedPostsNotFound)
      }
    }

    context.integration.settings.posts = cachedData

    context.pipelineData = {
      membersCache,
      posts,
      nangoId,
    }
  }

  async getStreams(context: IStepContext): Promise<IPendingStream[]> {
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
    context.logger.debug({ stream: stream.value, metadata: stream.metadata }, 'Processing stream!')

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
    let nextPageStream: IPendingStream | undefined

    const data = await getCommentComments(
      context.pipelineData.nangoId,
      stream.metadata.urnId,
      context.logger,
      stream.metadata.start,
    )

    if (data.start !== undefined) {
      nextPageStream = {
        value: stream.value,
        metadata: {
          ...stream.metadata,
          start: data.start,
        },
      }
    }

    const comments = data.elements

    const activities: AddActivitiesSingle[] = []

    for (const comment of comments) {
      const member = await this.parseMember(comment.authorUrn, context)

      activities.push({
        username: member.username[PlatformType.LINKEDIN].username,
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
          imageUrl: comment.imageUrl,
        },
        member,
        score: LINKEDIN_GRID[LinkedinActivityType.COMMENT].score,
        isContribution: LINKEDIN_GRID[LinkedinActivityType.COMMENT].isContribution,
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
        nextPageStream,
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
    let lastReactionTs: number | undefined
    const cachedPost = context.integration.settings.posts.find(
      (p) => p.id === stream.metadata.urnId,
    )
    if (!context.onboarding) {
      lastReactionTs = cachedPost.lastReactionTs
      if (lastReactionTs === undefined) {
        lastReactionTs = moment().subtract(1, 'month').valueOf()
      }
    }

    const data = await getPostReactions(
      context.pipelineData.nangoId,
      stream.metadata.urnId,
      context.logger,
      stream.metadata.start,
      lastReactionTs,
    )

    let nextPageStream: IPendingStream | undefined
    if (data.start !== undefined) {
      nextPageStream = {
        value: stream.value,
        metadata: {
          ...stream.metadata,
          start: data.start,
        },
      }
    }

    const reactions = data.elements

    const activities: AddActivitiesSingle[] = []

    for (const reaction of reactions) {
      const member = await this.parseMember(reaction.authorUrn, context)

      if (
        cachedPost.lastReactionTs === undefined ||
        cachedPost.lastReactionTs < reaction.timestamp
      ) {
        cachedPost.lastReactionTs = reaction.timestamp
      }

      activities.push({
        username: member.username[PlatformType.LINKEDIN].username,
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
        score: LINKEDIN_GRID[LinkedinActivityType.REACTION].score,
        isContribution: LINKEDIN_GRID[LinkedinActivityType.REACTION].isContribution,
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
        nextPageStream,
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
    let lastCommentTs: number | undefined
    const cachedPost = context.integration.settings.posts.find(
      (p) => p.id === stream.metadata.urnId,
    )

    if (!context.onboarding) {
      lastCommentTs = cachedPost.lastCommentTs

      const lastMonth = moment().subtract(1, 'month').valueOf()

      if (lastCommentTs === undefined) {
        lastCommentTs = lastMonth
      } else if (lastCommentTs > lastMonth) {
        // always check at least 1 month back so we can get possible nested comments
        lastCommentTs = lastMonth
      }
    }

    let nextPageStream: IPendingStream | undefined

    const data = await getPostComments(
      context.pipelineData.nangoId,
      stream.metadata.urnId,
      context.logger,
      stream.metadata.start,
      lastCommentTs,
    )

    if (data.start !== undefined) {
      nextPageStream = {
        value: stream.value,
        metadata: {
          ...stream.metadata,
          start: data.start,
        },
      }
    }

    const comments: ILinkedInPostComment[] = data.elements

    const activities: AddActivitiesSingle[] = []
    const newStreams: IPendingStream[] = []
    for (const comment of comments) {
      const member = await this.parseMember(comment.authorUrn, context)

      if (cachedPost.lastCommentTs === undefined || cachedPost.lastCommentTs < comment.timestamp) {
        cachedPost.lastCommentTs = comment.timestamp
      }

      activities.push({
        username: member.username[PlatformType.LINKEDIN].username,
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
          imageUrl: comment.imageUrl,
        },
        member,
        score: LINKEDIN_GRID[LinkedinActivityType.COMMENT].score,
        isContribution: LINKEDIN_GRID[LinkedinActivityType.COMMENT].isContribution,
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
        nextPageStream,
      }
    }

    return {
      operations: [],
    }
  }

  private async parseMember(memberUrn: string, context: IStepContext): Promise<Member> {
    const member: Member = {
      username: {
        [PlatformType.LINKEDIN]: {
          username: '',
          integrationId: context.integration.id,
        },
      } as PlatformIdentities,
      attributes: {
        [MemberAttributeName.URL]: {
          [PlatformType.LINKEDIN]: '',
        },
        [MemberAttributeName.IS_ORGANIZATION]: {
          [PlatformType.LINKEDIN]: false,
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.LINKEDIN]: '',
        },
      },
    }

    const membersCache: RedisCache = context.pipelineData.membersCache

    if (isLinkedInUser(memberUrn)) {
      const userId = getLinkedInUserId(memberUrn)

      const userString = await membersCache.getOrAdd(
        userId,
        async () => {
          const user = await getMember(context.pipelineData.nangoId, userId, context.logger)
          return JSON.stringify(user)
        },
        2 * 24 * 60 * 60,
      )

      const user = JSON.parse(userString)

      if (user.id === 'private') {
        member.username[PlatformType.LINKEDIN].username = `private-${userId}`
        member.username[PlatformType.LINKEDIN].sourceId = userId
        member.displayName = `Unknown #${userId}`
        member.attributes = {}
      } else {
        member.username[PlatformType.LINKEDIN].username = `${user.vanityName}`
        member.username[PlatformType.LINKEDIN].sourceId = user.id
        member.attributes[MemberAttributeName.URL][
          PlatformType.LINKEDIN
        ] = `https://www.linkedin.com/in/${user.vanityName}`
        member.displayName = `${user.firstName} ${user.lastName}`

        if (user.profilePictureUrl) {
          member.attributes[MemberAttributeName.AVATAR_URL] = {
            [PlatformType.LINKEDIN]: user.profilePictureUrl,
          }
        } else {
          delete member.attributes[MemberAttributeName.AVATAR_URL]
        }
      }
    } else if (isLinkedInOrganization(memberUrn)) {
      const userId = getLinkedInOrganizationId(memberUrn)

      const organizationString = await membersCache.getOrAdd(
        userId,
        async () => {
          const organization = await getOrganization(
            context.pipelineData.nangoId,
            userId,
            context.logger,
          )
          return JSON.stringify(organization)
        },
        2 * 24 * 60 * 60,
      )

      const organization = JSON.parse(organizationString)

      member.username[PlatformType.LINKEDIN].username = organization.name
      member.username[PlatformType.LINKEDIN].sourceId = userId
      member.displayName = organization.name
      member.attributes[MemberAttributeName.URL][
        PlatformType.LINKEDIN
      ] = `https://www.linkedin.com/company/${organization.vanityName}`
      member.attributes[MemberAttributeName.IS_ORGANIZATION][PlatformType.LINKEDIN] = true

      if (organization.profilePictureUrl) {
        member.attributes[MemberAttributeName.AVATAR_URL] = {
          [PlatformType.LINKEDIN]: organization.profilePictureUrl,
        }
      } else {
        delete member.attributes[MemberAttributeName.AVATAR_URL]
      }
    } else {
      throw new Error(`Could not determine member type from urn ${memberUrn}!`)
    }

    return member
  }

  private static isPrivateMember(member: Member): boolean {
    return member.username[PlatformType.LINKEDIN].username.startsWith('private-')
  }
}
