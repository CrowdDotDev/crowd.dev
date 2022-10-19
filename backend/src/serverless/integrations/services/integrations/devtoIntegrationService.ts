import lodash from 'lodash'
import sanitizeHtml from 'sanitize-html'
import { getArticleComments } from '../../usecases/devto/getArticleComments'
import { createChildLogger } from '../../../../utils/logging'
import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
  IStreamsResult,
} from '../../../../types/integration/stepResult'
import { DevtoMemberAttributes } from '../../../../database/attributes/member/devto'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'
import { GithubMemberAttributes } from '../../../../database/attributes/member/github'
import { TwitterMemberAttributes } from '../../../../database/attributes/member/twitter'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import { single, singleOrDefault } from '../../../../utils/arrays'
import { IntegrationType, PlatformType } from '../../../../types/integrationEnums'
import { DevtoArticleSettings, DevtoIntegrationSettings } from '../../types/devtoTypes'
import { getAllOrganizationArticles } from '../../usecases/devto/getOrganizationArticles'
import { getAllUserArticles } from '../../usecases/devto/getUserArticles'
import { DevtoArticle, DevtoComment, DevtoUser } from '../../usecases/devto/types'
import { IntegrationServiceBase } from '../integrationServiceBase'
import { getUserById } from '../../usecases/devto/getUser'
import { AddActivitiesSingle, Member } from '../../types/messageTypes'
import { DevtoGrid } from '../../grid/devtoGrid'
import Operations from '../../../dbOperations/operations'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class DevtoIntegrationService extends IntegrationServiceBase {
  constructor() {
    super(IntegrationType.DEVTO, 0, 3)
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.serviceContext)

    await service.createPredefined(DevtoMemberAttributes)

    await service.createPredefined(
      MemberAttributeSettingsService.pickAttributes(
        [MemberAttributeName.URL],
        TwitterMemberAttributes,
      ),
    )

    await service.createPredefined(
      MemberAttributeSettingsService.pickAttributes(
        [MemberAttributeName.URL, MemberAttributeName.NAME],
        GithubMemberAttributes,
      ),
    )
  }

  async getStreams(context: IStepContext): Promise<IStreamsResult> {
    const settings = context.integration.settings as DevtoIntegrationSettings

    const articles = settings.articles ? settings.articles : []
    let articlesFromAPI: DevtoArticle[] = []
    if (settings.organizations.length > 0) {
      for (const organization of settings.organizations) {
        const articles = await getAllOrganizationArticles(organization)
        articlesFromAPI.push(...articles)
      }
    }

    if (settings.users.length > 0) {
      for (const user of settings.users) {
        const articles = await getAllUserArticles(user)
        articlesFromAPI.push(...articles)
      }
    }

    articlesFromAPI = lodash.uniqBy(articlesFromAPI, (a) => a.id)

    // Now lets find all articles that needs to be checked for fresh comments
    const articlesToCheck: DevtoArticle[] = []
    for (const article of articlesFromAPI) {
      const existingArticle = singleOrDefault(articles, (a) => a.id === article.id)

      let check = false
      if (existingArticle) {
        if (!existingArticle.lastCommentAt) {
          // we have an article that wasn't checked before
          check = true
        } else if (existingArticle.lastCommentAt !== article.last_comment_at) {
          // we have an article where last comment dates from our database does not match the date from
          // the API so this means that we have new comments
          check = true
        }
      } else {
        // we have a new article that hasn't been checked before
        check = true
      }

      if (check) {
        articlesToCheck.push(article)
      }
    }

    return {
      processMetadata: {
        articles: articlesToCheck,
        articlesFromAPI,
      },
      streams: articlesToCheck.map((a) => ({
        value: a.id.toString(),
      })),
    }
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
    metadata?: any,
  ): Promise<IProcessStreamResults> {
    const logger = createChildLogger('processStream', context.serviceContext.log, { stream })

    logger.info('Processing article!')

    const articleId = parseInt(stream.value, 10)

    const comments = await getArticleComments(articleId)

    const userIds: number[] = DevtoIntegrationService.getUserIdsFromComments(comments)
    for (const userId of userIds) {
      const fullUser = await getUserById(userId)
      if (fullUser !== null) {
        DevtoIntegrationService.setFullUser(comments, fullUser)
      }
    }

    const activities: AddActivitiesSingle[] = []

    for (const comment of comments) {
      activities.push(
        ...this.parseComment(context.integration.tenantId, articleId, comment, metadata.articles),
      )
    }

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: activities,
        },
      ],
    }
  }

  async postprocess(
    context: IStepContext,
    metadata?: any,
    failedStreams?: IIntegrationStream[],
    remainingStreams?: IIntegrationStream[],
  ): Promise<void> {
    const articles: DevtoArticleSettings[] = []

    for (const article of metadata.articlesFromAPI) {
      articles.push({ id: article.id, lastCommentAt: article.last_comment_at })
    }

    for (const oldArticle of context.integration.settings.articles) {
      if (singleOrDefault(articles, (a) => a.id === oldArticle.id) === undefined) {
        articles.push(oldArticle)
      }
    }

    context.integration.settings.articles = articles
  }

  private parseComment(
    tenantId: string,
    articleId: number,
    comment: DevtoComment,
    articles: DevtoArticle[],
    parentCommentId?: string,
  ): AddActivitiesSingle[] {
    const article = single(articles, (a) => a.id === articleId)
    const activities: AddActivitiesSingle[] = []

    // comment was deleted or the user deleted his account
    if (!comment.user.username) {
      return []
    }

    const member: Member = {
      username: {
        [PlatformType.DEVTO]: comment.user.username,
      },
      attributes: {
        [MemberAttributeName.URL]: {
          [PlatformType.DEVTO]: `https://dev.to/${encodeURIComponent(comment.fullUser.username)}`,
        },
      },
    }

    if (comment.user.twitter_username) {
      member.attributes[MemberAttributeName.URL][
        PlatformType.TWITTER
      ] = `https://twitter.com/${comment.user.twitter_username}`
      member.username[PlatformType.TWITTER] = comment.user.twitter_username
    }

    if (comment.user.github_username) {
      member.attributes[MemberAttributeName.NAME] = {
        [PlatformType.GITHUB]: comment.user.name,
      }
      member.attributes[MemberAttributeName.URL][
        PlatformType.GITHUB
      ] = `https://github.com/${comment.user.github_username}`
      member.username[PlatformType.GITHUB] = comment.user.github_username
    }

    if (comment.fullUser) {
      member.attributes[MemberAttributeName.BIO] = {
        [PlatformType.DEVTO]: comment.fullUser?.summary || '',
      }
      member.attributes[MemberAttributeName.LOCATION] = {
        [PlatformType.DEVTO]: comment.fullUser?.location || '',
      }
    }

    activities.push({
      tenant: tenantId,
      platform: PlatformType.DEVTO,
      type: 'comment',
      timestamp: new Date(comment.created_at),
      sourceId: comment.id_code,
      sourceParentId: parentCommentId,
      body: sanitizeHtml(comment.body_html),
      url: `https://dev.to/${encodeURIComponent(comment.fullUser.username)}/comment/${
        comment.id_code
      }`,
      attributes: {
        thread: parentCommentId !== undefined,
        userUrl: `https://dev.to/${encodeURIComponent(comment.fullUser.username)}`,
        articleUrl: article.url,
        articleTitle: article.title,
      },
      member,
      score: DevtoGrid.comment.score,
      isKeyAction: DevtoGrid.comment.isKeyAction,
    })

    for (const child of comment.children) {
      activities.push(...this.parseComment(tenantId, articleId, child, articles, comment.id_code))
    }

    return activities
  }

  /**
   * Get all unique user ids from comments and their children
   *
   * @param comments All comments to parse
   * @returns {number[]} unique user ids
   */
  private static getUserIdsFromComments(comments: DevtoComment[]): number[] {
    const userIds: number[] = comments.map((c) => c.user.user_id)
    for (const comment of comments) {
      if (comment.children.length > 0) {
        userIds.push(...DevtoIntegrationService.getUserIdsFromComments(comment.children))
      }
    }

    return lodash.uniq(userIds)
  }

  /**
   * Set full user to all relevant comments
   *
   * @param comments All comments to parse and set full user to
   * @param fullUser a user with the whole profile
   */
  private static setFullUser(comments: DevtoComment[], fullUser: DevtoUser) {
    for (const comment of comments) {
      if (comment.user.user_id === fullUser.id) {
        comment.fullUser = fullUser
      }

      if (comment.children.length > 0) {
        DevtoIntegrationService.setFullUser(comment.children, fullUser)
      }
    }
  }
}
