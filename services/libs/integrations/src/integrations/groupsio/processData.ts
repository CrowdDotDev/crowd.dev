// processData.ts content
import { ProcessDataHandler } from '../../types'
import { Groupsio_GRID } from './grid'
import {
  GroupsioPublishData,
  GroupsioPublishDataType,
  GroupsioMessageData,
  MemberInfo,
  GroupsioMemberJoinData,
  GroupsioMemberLeftData,
  GroupsioActivityType,
} from './types'
import { IActivityData, IMemberData, PlatformType } from '@crowd/types'
import sanitizeHtml from 'sanitize-html'

const processMemberJoin: ProcessDataHandler = async (ctx) => {
  const metaData = ctx.data as GroupsioPublishData<GroupsioMemberJoinData>
  const data = metaData.data
  const memberData = data.member as MemberInfo

  const member: IMemberData = {
    displayName: memberData.full_name,
    emails: [memberData.email],
    identities: [
      {
        sourceId: memberData.user_id.toString(),
        platform: PlatformType.GROUPSIO,
        username: memberData.email,
      },
    ],
  }

  const activity: IActivityData = {
    type: GroupsioActivityType.MEMBER_JOIN,
    member,
    channel: data.group,
    timestamp: data.joinedAt,
    sourceId: `join-${memberData.user_id}-${memberData.group_id}-${data.joinedAt}`,
    score: Groupsio_GRID[GroupsioActivityType.MEMBER_JOIN].score,
    isContribution: Groupsio_GRID[GroupsioActivityType.MEMBER_JOIN].isContribution,
  }

  await ctx.publishActivity(activity)
}

const processMessage: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as GroupsioPublishData<GroupsioMessageData>
  const messageData = data.data
  const memberData = messageData.member

  const member: IMemberData = {
    displayName: memberData.full_name,
    emails: [memberData.email],
    identities: [
      {
        sourceId: memberData.user_id.toString(),
        platform: PlatformType.GROUPSIO,
        username: memberData.email,
      },
    ],
  }

  const activity: IActivityData = {
    type: GroupsioActivityType.MESSAGE,
    member,
    channel: messageData.group,
    timestamp: new Date(messageData.message.created).toISOString(),
    sourceId: `${messageData.message.id}`,
    score: Groupsio_GRID[GroupsioActivityType.MESSAGE].score,
    body: sanitizeHtml(messageData.message.body),
    title: sanitizeHtml(messageData.topic.subject),
    ...(messageData.sourceParentId && {
      sourceParentId: messageData.sourceParentId,
    }),
    isContribution: Groupsio_GRID[GroupsioActivityType.MESSAGE].isContribution,
  }

  await ctx.publishActivity(activity)
}

const processMemberLeft: ProcessDataHandler = async (ctx) => {
  const metaData = ctx.data as GroupsioPublishData<GroupsioMemberLeftData>
  const data = metaData.data
  const memberData = data.member as MemberInfo

  const member: IMemberData = {
    displayName: memberData.full_name,
    emails: [memberData.email],
    identities: [
      {
        sourceId: memberData.user_id.toString(),
        platform: PlatformType.GROUPSIO,
        username: memberData.email,
      },
    ],
  }

  const activity: IActivityData = {
    type: GroupsioActivityType.MEMBER_LEAVE,
    member,
    channel: data.group,
    timestamp: data.leftAt,
    sourceId: `left-${memberData.user_id}-${memberData.group_id}-${data.leftAt}`,
    score: Groupsio_GRID[GroupsioActivityType.MEMBER_LEAVE].score,
    isContribution: Groupsio_GRID[GroupsioActivityType.MEMBER_LEAVE].isContribution,
  }

  await ctx.publishActivity(activity)
}

const handler: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as GroupsioPublishData<unknown>

  const type = data.type

  switch (type) {
    case GroupsioPublishDataType.MEMBER_JOIN:
      await processMemberJoin(ctx)
      break
    case GroupsioPublishDataType.MESSAGE:
      await processMessage(ctx)
      break
    case GroupsioPublishDataType.MEMBER_LEFT:
      await processMemberLeft(ctx)
      break
    default:
      await ctx.abortRunWithError(`Unknown publish data type: ${type}`)
  }
}

export default handler
