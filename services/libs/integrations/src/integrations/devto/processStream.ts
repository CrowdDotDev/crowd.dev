import { IntegrationStreamType } from '@crowd/types'
import { IProcessStreamContext, ProcessStreamHandler } from '../../types'
import { DevToRootStream, IDevToIntegrationSettings } from './types'
import { getOrganizationArticles, getUserArticles } from './api/articles'
import { getArticle } from './api/articles'
import { getArticleComments } from './api/comments'
import { getUserIdsFromComments, setFullUser } from './utils'
import { getUser } from './api/user'

const getDevToArticle = async (ctx: IProcessStreamContext, id: number) => {
  const cached = await ctx.cache.get(`article:${id}`)
  if (cached) {
    return JSON.parse(cached)
  }

  const article = await getArticle(id)
  await ctx.cache.set(`article:${id}`, JSON.stringify(article), 7 * 24 * 60 * 60) // store for 7 days
  return article
}

const getDevToUser = async (ctx: IProcessStreamContext, userId: number) => {
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
  const settings = ctx.integration.settings as IDevToIntegrationSettings

  switch (ctx.stream.identifier) {
    case DevToRootStream.ORGANIZATION_ARTICLES: {
      if (settings.organizations.length === 0) {
        await ctx.abortWithError('No organizations configured!')
        return
      }

      for (const organization of settings.organizations) {
        let page = 1
        let articles = await getOrganizationArticles(organization, page, 20)
        while (articles.length > 0) {
          for (const article of articles) {
            ctx.log.info(`Creating organization article stream with identifier ${article.id}!`)
            await ctx.cache.set(`article:${article.id}`, JSON.stringify(article), 7 * 24 * 60 * 60) // store for 7 days
            await ctx.publishStream(`${article.id}`)
          }
          articles = await getOrganizationArticles(organization, ++page, 20)
        }
      }
      break
    }

    case DevToRootStream.USER_ARTICLES: {
      if (settings.users.length === 0) {
        await ctx.abortWithError('No users configured!')
        return
      }

      for (const user of settings.users) {
        let page = 1
        let articles = await getUserArticles(user, page, 20)
        while (articles.length > 0) {
          for (const article of articles) {
            ctx.log.info(`Creating user article stream with identifier ${article.id}!`)
            await ctx.cache.set(`article:${article.id}`, JSON.stringify(article), 7 * 24 * 60 * 60) // store for 7 days
            await ctx.publishStream(`${article.id}`)
          }
          articles = await getUserArticles(user, ++page, 20)
        }
      }
      break
    }

    default: {
      await ctx.abortWithError(`Unknown root stream identifier: ${ctx.stream.identifier}`)
    }
  }
}

const processArticleStream: ProcessStreamHandler = async (ctx) => {
  const articleId = parseInt(ctx.stream.identifier, 10)

  ctx.log.info(`Processing article stream with id ${articleId}!`)

  const comments = await getArticleComments(articleId)

  const userIds = getUserIdsFromComments(comments)
  for (const userId of userIds) {
    const fullUser = await getDevToUser(ctx, userId)
    if (fullUser) {
      setFullUser(comments, fullUser)
    }
  }

  await ctx.publishData({
    article: await getDevToArticle(ctx, articleId),
    comments,
  })
}

const handler: ProcessStreamHandler = async (ctx) => {
  if (ctx.stream.type === IntegrationStreamType.ROOT) {
    await processRootStream(ctx)
  } else {
    processArticleStream(ctx)
  }
}

export default handler
