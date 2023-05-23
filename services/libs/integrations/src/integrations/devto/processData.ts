import { IProcessDataContext, ProcessDataHandler } from 'src/types'
import { IDevToArticle } from './api/articles'
import { IDevToComment } from './api/comments'
import { IActivityData, IMemberData, MemberAttributeName, PlatformType } from '@crowd/types'
import sanitizeHtml from 'sanitize-html'

const getMember = (comment: IDevToComment): IMemberData => {
  const member: IMemberData = {
    identities: [
      {
        platform: PlatformType.DEVTO,
        username: comment.user.username,
      },
    ],
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

    if (!member.weakIdentities) {
      member.weakIdentities = []
    }
    member.weakIdentities.push({
      platform: PlatformType.TWITTER,
      username: comment.user.twitter_username,
    })
  }

  if (comment.user.github_username) {
    member.attributes[MemberAttributeName.NAME] = {
      [PlatformType.GITHUB]: comment.user.name,
    }
    member.attributes[MemberAttributeName.URL][
      PlatformType.GITHUB
    ] = `https://github.com/${comment.user.github_username}`

    if (!member.weakIdentities) {
      member.weakIdentities = []
    }
    member.weakIdentities.push({
      platform: PlatformType.GITHUB,
      username: comment.user.github_username,
    })
  }

  if (comment.fullUser) {
    member.attributes[MemberAttributeName.BIO] = {
      [PlatformType.DEVTO]: comment.fullUser?.summary || '',
    }
    member.attributes[MemberAttributeName.LOCATION] = {
      [PlatformType.DEVTO]: comment.fullUser?.location || '',
    }
  }

  return member
}

const processComment = async (
  ctx: IProcessDataContext,
  article: IDevToArticle,
  comment: IDevToComment,
  parentCommentId?: string,
) => {
  if (!comment.user.username) {
    return
  }

  const member = getMember(comment)

  const activity: IActivityData = {
    type: 'comment',
    timestamp: comment.created_at,
    score: 6,
    isContribution: true,
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
  }

  await ctx.publishActivity(activity)

  while (comment.children.length > 0) {
    const child = comment.children.shift()
    await processComment(ctx, article, child, comment.id_code)
  }
}

const handler: ProcessDataHandler = async (ctx) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = ctx.data as any

  const article = data.article as IDevToArticle
  const comments = data.comments as IDevToComment[]

  while (comments.length > 0) {
    const comment = comments.shift()
    await processComment(ctx, article, comment)
  }
}

export default handler
