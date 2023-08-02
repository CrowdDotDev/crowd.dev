import { ProcessDataHandler, IProcessDataContext } from '@/types'
import {
  IDiscordAPIData,
  DiscordApiMember,
  DiscordApiDataMessage,
  DiscordApiUser,
  DiscordActivityType,
  DiscordAPIDataType,
} from './types'
import { DISCORD_GRID } from './grid'
import { IActivityData } from '@crowd/types'
import { PlatformType } from '@crowd/types'
import { MemberAttributeName } from '@crowd/types'
import { generateUUIDv1 } from '@crowd/common'
import { MessageType } from './externalTypes'

/**
 * Parse mentions
 * @param text Message text
 * @param mentions
 * @returns Message text, swapping mention IDs by mentions
 */
function replaceMentions(text: string, mentions: DiscordApiUser[] | undefined): string {
  if (mentions === undefined) return text

  // Replace <@!123456789> by @username
  text = text.replace(/<@!(\d+)>/g, (match, id) => {
    const mention = mentions.find((m) => m.id === id)
    return mention ? `@${mention.username}` : match
  })
  // Replace <@123456789> by @username
  text = text.replace(/<@(\d+)>/g, (match, id) => {
    const mention = mentions.find((m) => m.id === id)
    return mention ? `@${mention.username}` : match
  })

  return text
}

const parseMembers = async (ctx: IProcessDataContext) => {
  const data = ctx.data as IDiscordAPIData
  const members = data.data as DiscordApiMember[]

  for (const record of members) {
    if (!record.user.bot) {
      let avatarUrl: string | boolean = false

      if (record.user.avatar !== null && record.user.avatar !== undefined) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${record.user.id}/${record.user.avatar}.png`
      }

      const joinedAt = new Date(record.joined_at).toISOString()
      const sourceId = `gen-${record.user.id}-${joinedAt}`

      let username = record.user.username

      if (username === 'Deleted User') {
        username = `${username}:${generateUUIDv1()}`
      }

      const activity: IActivityData = {
        type: DiscordActivityType.JOINED_GUILD,
        sourceId,
        timestamp: joinedAt,
        username,
        member: {
          identities: [
            {
              platform: PlatformType.DISCORD,
              sourceId: record.user.id,
              username,
            },
          ],
          attributes: {
            [MemberAttributeName.SOURCE_ID]: {
              [PlatformType.DISCORD]: record.user.id,
            },
            ...(avatarUrl && {
              [MemberAttributeName.AVATAR_URL]: {
                [PlatformType.DISCORD]: avatarUrl,
              },
            }),
          },
        },
        score: DISCORD_GRID[DiscordActivityType.JOINED_GUILD].score,
        isContribution: DISCORD_GRID[DiscordActivityType.JOINED_GUILD].isContribution,
      }

      await ctx.publishActivity(activity)
    }
  }
}

const parseMessage = async (ctx: IProcessDataContext) => {
  const data = ctx.data as IDiscordAPIData
  const record = data.data as DiscordApiDataMessage

  if (!record.author.bot && [MessageType.Default, MessageType.Reply].includes(record.type)) {
    let username = record.author.username

    if (username === 'Deleted User') {
      username = `${username}:${generateUUIDv1()}`
    }

    let avatarUrl: string | boolean = false
    if (record.author.avatar !== null && record.author.avatar !== undefined) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${record.author.id}/${record.author.avatar}.png`
    }

    const activityObject: IActivityData = {
      type: record.isForum && record.id === record.parent ? 'thread_started' : 'message',
      sourceId: record.id,
      sourceParentId: record.parent,
      timestamp: new Date(record.timestamp).toISOString(),
      title: record.isThread || record.isForum ? record.channel.name : undefined,
      body: record.content ? replaceMentions(record.content, record.mentions) : '',
      url: `https://discord.com/channels/${record.channel.guild_id}/${record.channel.id}/${record.id}`,
      channel: record.parentChannel || record.channel.name,
      attributes: {
        childChannel: record.parentChannel ? record.channel.name : undefined,
        thread: record.isThread,
        reactions: record.reactions ? record.reactions : [],
        attachments: record.attachments ? record.attachments : [],
        forum: record.isForum,
      },
      member: {
        identities: [
          {
            platform: PlatformType.DISCORD,
            sourceId: record.author.id,
            username: record.author.username,
          },
        ],
        attributes: {
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.DISCORD]: record.author.id,
          },
          ...(avatarUrl && {
            [MemberAttributeName.AVATAR_URL]: {
              [PlatformType.DISCORD]: avatarUrl,
            },
          }),
          // Add isBot attribute for deleted users to exclude from search. Add if username contains Deleted User
          ...(username.includes('Deleted User') && {
            [MemberAttributeName.IS_BOT]: {
              [PlatformType.DISCORD]: true,
            },
          }),
        },
      },
      score: DISCORD_GRID[DiscordActivityType.MESSAGE].score,
      isContribution: DISCORD_GRID[DiscordActivityType.MESSAGE].isContribution,
    }

    await ctx.publishActivity(activityObject)
  }
}

const handler: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as IDiscordAPIData

  if (data.type === DiscordAPIDataType.MEMBER) {
    await parseMembers(ctx)
  } else if (data.type === DiscordAPIDataType.CHANNEL) {
    await parseMessage(ctx)
  } else {
    await ctx.abortRunWithError(`Unknown data type: ${data.type}`)
  }
}

export default handler
