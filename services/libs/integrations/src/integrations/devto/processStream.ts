import { IntegrationStreamType } from '@crowd/types'
import { IProcessStreamContext, ProcessStreamHandler } from '../../types'
import { IDevToArticle, getArticle, getOrganizationArticles, getUserArticles } from './api/articles'
import { getArticleComments } from './api/comments'
import { IDevToUser, getUser } from './api/user'
import {
  DevToRootStream,
  IDevToArticleData,
  IDevToRootOrganizationStreamData,
  IDevToRootUserStreamData,
} from './types'
import { getUserIdsFromComments, setFullUser } from './utils'

const DEVTO_MAX_COMMENTS_RETROSPECT_IN_HOURS = 24

interface IDevToArticleCacheResponse {
  article: IDevToArticle
  cacheExpired: boolean
}

const getDevToArticle = async (
  ctx: IProcessStreamContext,
  id: number,
): Promise<IDevToArticleCacheResponse> => {
  const cached = await ctx.cache.get(`article:${id}`)
  if (cached) {
    return {
      article: JSON.parse(cached),
      cacheExpired: false,
    }
  }

  const article = await getArticle(id)
  await ctx.cache.set(`article:${id}`, JSON.stringify(article), 7 * 24 * 60 * 60) // store for 7 days
  return {
    article,
    cacheExpired: true,
  }
}

const getDevToUser = async (ctx: IProcessStreamContext, userId: number): Promise<IDevToUser> => {
  const cached = await ctx.cache.get(`user:${userId}`)
  if (cached) {
    return JSON.parse(cached)
  }

  const user = await getUser(userId)
  await ctx.cache.set(`user:${userId}`, JSON.stringify(user), 7 * 24 * 60 * 60) // store for 7 days
  return user
}

const processRootStream: ProcessStreamHandler = async (ctx) => {
  // no data here just new streams
  if (ctx.stream.identifier.startsWith(DevToRootStream.ORGANIZATION_ARTICLES)) {
    const organization = (ctx.stream.data as IDevToRootOrganizationStreamData).organization
    let page = 1
    let articles = await getOrganizationArticles(organization, page, 20)
    while (articles.length > 0) {
      for (const article of articles) {
        ctx.log.debug(`Creating organization article stream with identifier ${article.id}!`)
        await ctx.cache.set(`article:${article.id}`, JSON.stringify(article), 7 * 24 * 60 * 60) // store for 7 days
        await ctx.publishStream(`${article.id}`)
      }
      articles = await getOrganizationArticles(organization, ++page, 20)
    }
  } else if (ctx.stream.identifier.startsWith(DevToRootStream.USER_ARTICLES)) {
    const user = (ctx.stream.data as IDevToRootUserStreamData).user
    let page = 1
    let articles = await getUserArticles(user, page, 20)
    while (articles.length > 0) {
      for (const article of articles) {
        ctx.log.debug(`Creating user article stream with identifier ${article.id}!`)
        await ctx.cache.set(`article:${article.id}`, JSON.stringify(article), 7 * 24 * 60 * 60) // store for 7 days
        await ctx.publishStream(`${article.id}`)
      }
      articles = await getUserArticles(user, ++page, 20)
    }
  } else {
    await ctx.abortWithError(`Unknown root stream identifier: ${ctx.stream.identifier}`)
  }
}

const processArticleStream: ProcessStreamHandler = async (ctx) => {
  const articleId = parseInt(ctx.stream.identifier, 10)

  ctx.log.debug({ devtoArticleId: articleId }, 'Processing article stream!')

  const comments = await getArticleComments(articleId)

  if (comments.length > 0) {
    ctx.log.debug(
      { devtoArticleId: articleId, nComments: comments.length },
      'We have found comments for this article!',
    )

    if (!ctx.onboarding) {
      // let's get a date of the most recent comment
      const mostRecentComment = comments.reduce((acc, comment) => {
        if (new Date(comment.created_at) > new Date(acc)) {
          return comment.created_at
        }
        return acc
      }, comments[0].created_at)

      // if the most recent comment is older than DEVTO_MAX_COMMENTS_RETROSPECT_IN_HOURS day, we don't need to process this article
      const mostRecentCommentDate = new Date(mostRecentComment)
      const now = new Date()
      const diff = now.getTime() - mostRecentCommentDate.getTime()
      const hours = diff / (1000 * 60 * 60)
      if (hours > DEVTO_MAX_COMMENTS_RETROSPECT_IN_HOURS) {
        const { cacheExpired } = await getDevToArticle(ctx, articleId)
        if (!cacheExpired) {
          ctx.log.debug(
            { devtoArticleId: articleId, mostRecentComment, hours },
            `Most recent comment is older than ${DEVTO_MAX_COMMENTS_RETROSPECT_IN_HOURS} hours and article is still cached, not processing`,
          )
          return
        } else {
          ctx.log.debug(
            { devtoArticleId: articleId, mostRecentComment, hours },
            `Most recent comment is older than ${DEVTO_MAX_COMMENTS_RETROSPECT_IN_HOURS} hours, but article expired in cache, processing`,
          )
        }
      }
    }

    const userIds = getUserIdsFromComments(comments)
    for (const userId of userIds) {
      const fullUser = await getDevToUser(ctx, userId)
      if (fullUser) {
        setFullUser(comments, fullUser)
      }
    }

    await ctx.publishData<IDevToArticleData>({
      article: (await getDevToArticle(ctx, articleId)).article,
      comments,
    })
  } else {
    ctx.log.debug({ devtoArticleId: articleId }, 'No comments found for this article!')
  }
}

const handler: ProcessStreamHandler = async (ctx) => {
  if (ctx.stream.type === IntegrationStreamType.ROOT) {
    await processRootStream(ctx)
  } else {
    await processArticleStream(ctx)
  }
}

export default handler
