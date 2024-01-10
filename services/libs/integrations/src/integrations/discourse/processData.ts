// processData.ts content
import { ProcessDataHandler } from '../../types'
import {
  DiscoursePublishPostData,
  DiscoursePublishUserWebhookData,
  DiscoursePublishNotificationWebhookData,
  DiscourseUserResponse,
  DiscourseConnectionParams,
  DiscourseActivityType,
  DiscoursePublishData,
  DiscourseDataType,
  FullUser,
} from './types'
import { PlatformType, IMemberData, MemberAttributeName, IActivityData } from '@crowd/types'
import sanitizeHtml from 'sanitize-html'
import he from 'he'
import { DISCOURSE_GRID } from './grid'

const parseUserIntoMember = (user: DiscourseUserResponse, forumHostname: string): IMemberData => {
  const member: IMemberData = {
    identities: [
      {
        username: user.user.username,
        platform: PlatformType.DISCOURSE,
      },
    ],
    displayName: user.user.name,
    attributes: {
      [MemberAttributeName.URL]: {
        [PlatformType.DISCOURSE]: `${forumHostname}/u/${user.user.username}`,
      },
      [MemberAttributeName.WEBSITE_URL]: {
        [PlatformType.DISCOURSE]: user.user.website || '',
      },
      [MemberAttributeName.LOCATION]: {
        [PlatformType.DISCOURSE]: user.user.location || '',
      },
      [MemberAttributeName.BIO]: {
        [PlatformType.DISCOURSE]: user.user.bio_cooked
          ? sanitizeHtml(he.decode(user.user.bio_cooked))
          : '',
      },
      [MemberAttributeName.AVATAR_URL]: {
        [PlatformType.DISCOURSE]:
          `${forumHostname}${user.user.avatar_template.replace('{size}', '200')}` || '',
      },
    },
    emails: user.user.email ? [user.user.email] : [],
  }

  return member
}

const processPost: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as DiscoursePublishPostData

  const { forumHostname } = ctx.integration.settings as DiscourseConnectionParams

  const member = parseUserIntoMember(data.user, forumHostname)

  const activity: IActivityData = {
    member,
    type:
      data.post.post_number === 1
        ? DiscourseActivityType.CREATE_TOPIC
        : DiscourseActivityType.MESSAGE_IN_TOPIC,
    platform: PlatformType.DISCOURSE,
    sourceId: `${data.topicId}-${data.post.post_number}`,
    sourceParentId:
      data.post.post_number === 1 ? null : `${data.topicId}-${data.post.post_number - 1}`,
    timestamp: new Date(data.post.created_at).toISOString(),
    body: sanitizeHtml(he.decode(data.post.cooked)),
    title: data.post.post_number === 1 ? data.topicTitle : null,
    url: `${forumHostname}/t/${data.topicSlug}/${data.topicId}/${data.post.post_number}`,
    channel: data.topicTitle,
    score:
      data.post.post_number === 1
        ? DISCOURSE_GRID[DiscourseActivityType.CREATE_TOPIC].score
        : DISCOURSE_GRID[DiscourseActivityType.MESSAGE_IN_TOPIC].score,
    isContribution:
      data.post.post_number === 1
        ? DISCOURSE_GRID[DiscourseActivityType.CREATE_TOPIC].isContribution
        : DISCOURSE_GRID[DiscourseActivityType.MESSAGE_IN_TOPIC].isContribution,
  }

  await ctx.publishActivity(activity)
}

const processUserWebhook: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as DiscoursePublishUserWebhookData

  const { forumHostname } = ctx.integration.settings as DiscourseConnectionParams

  const member = parseUserIntoMember(
    {
      user: data.user as unknown as FullUser,
      user_badges: [],
      badges: [],
      badge_types: [],
      users: [],
    },
    forumHostname,
  )

  const activity: IActivityData = {
    member,
    platform: PlatformType.DISCOURSE,
    sourceId: `${data.user.id}`,
    type: DiscourseActivityType.JOIN,
    timestamp: new Date(data.user.created_at).toISOString(),
    body: null,
    title: null,
    url: `${forumHostname}/u/${data.user.username}`,
    channel: null,
    score: DISCOURSE_GRID[DiscourseActivityType.JOIN].score,
    isContribution: DISCOURSE_GRID[DiscourseActivityType.JOIN].isContribution,
  }

  await ctx.publishActivity(activity)
}

const processNotificationWebhook: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as DiscoursePublishNotificationWebhookData

  const { forumHostname } = ctx.integration.settings as DiscourseConnectionParams

  const member = parseUserIntoMember(data.user, forumHostname)

  const activity: IActivityData = {
    member,
    platform: PlatformType.DISCOURSE,
    sourceId: `${data.notification.id}`,
    type: DiscourseActivityType.LIKE,
    timestamp: new Date(data.notification.created_at).toISOString(),
    body: null,
    title: null,
    channel: data.channel,
    score: DISCOURSE_GRID[DiscourseActivityType.LIKE].score,
    isContribution: DISCOURSE_GRID[DiscourseActivityType.LIKE].isContribution,
    attributes: {
      topicURL: `${forumHostname}/t/${data.notification.slug}/${data.notification.topic_id}`,
    },
  }

  await ctx.publishActivity(activity)
}

const handler: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as DiscoursePublishData

  const type = data.type

  switch (type) {
    case DiscourseDataType.POST:
      await processPost(ctx)
      break
    case DiscourseDataType.USER_WEBHOOK:
      await processUserWebhook(ctx)
      break
    case DiscourseDataType.NOTIFICATION_WEBHOOK:
      await processNotificationWebhook(ctx)
      break
    default:
      ctx.log.error(`Unknown Discourse data type: ${type}`)
  }
}

export default handler
