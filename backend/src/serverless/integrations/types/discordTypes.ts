import { AddActivitiesSingle } from './messageTypes'
import { IIntegrationStream } from '../../../types/integration/stepResult'

export interface DiscordGetChannelsInput {
  guildId: string
  token: string
}

export interface DiscordGetMessagesInput {
  channelId: string
  token: string
  page: string | undefined
  perPage: number | 100
  showError?: boolean
}

export interface DiscordGetMembersInput {
  guildId: string
  token: string
  page: string | undefined
  perPage: number | 100
}

export interface DiscordChannel {
  parentId?: string
  id: string
  name: string
  thread?: boolean
  type?: number
}

export type DiscordChannels = DiscordChannel[]

export interface DiscordChannelsOut  {
  channels: DiscordChannels,
  forumChannels: DiscordChannels,
}

export interface DiscordAuthor {
  id: string
  username: string
  avatar: string | null
  bot?: boolean
}

export interface DiscordMention {
  id: string
  username: string
}

export interface DiscordMessage {
  id: string
  type: number
  content: string
  channel_id: string
  author: DiscordAuthor
  attachments?: any
  reactions?: any
  timestamp: string
  mentions?: [DiscordMention]
  message_reference: {
    message_id: string
    guild_id: string
    channel_id: string
  }
  thread: {
    id: string
  }
}

export type DiscordMessages = DiscordMessage[]

export interface DiscordStreamProcessResult {
  activities: AddActivitiesSingle[]
  newStreams: IIntegrationStream[]
}

export interface DiscordMember {
  user: DiscordAuthor
  joined_at: string
  id: string
}

export type DiscordMembers = DiscordMember[]

export interface DiscordParsedReponse {
  records: any
  nextPage: string
  limit: number
  timeUntilReset: number
}

export interface DiscordGetMessagesOutput extends DiscordParsedReponse {
  records: DiscordMessages | []
}

export interface DiscordGetMembersOutput extends DiscordParsedReponse {
  records: DiscordMembers | []
}

export type ProcessedChannel = {
  id: string
  name: string
  thread?: boolean
  new?: boolean
}

export interface ProcessedChannels {
  channels: Array<ProcessedChannel>
  forumChannels: Array<ProcessedChannel>
}
