export enum SlackActivityType {
  JOINED_CHANNEL = 'channel_joined',
  MESSAGE = 'message',
}

export enum SlackStreamType {
  ROOT = 'root',
  CHANNEL = 'channel',
  MEMBERS = 'members',
  THREADS = 'threads',
}
export interface ISlackPlatformSettings {
  maxRetrospectInSeconds: number
}

export interface ISlackStreamBase {
  token: string
  channelsInfo: any
  teamUrl: string
  team: SlackTeam
  channels: any[]
}

export interface ISlackAPIData {
  type: 'members' | 'threads' | 'channel'
  message?: SlackMessage
  member: SlackMember
  channelId?: string
  threadId?: string
  placeholder?: string
  channel?: string
  base: ISlackStreamBase
}

export interface ISlackRootSteamData {
  token: string
  channels: any[]
}

export interface ISlackMemberStreamData extends ISlackStreamBase {
  page: string
}

export interface ISlackChannelStreamData extends ISlackStreamBase {
  channelId: string
  page: string
  general: any
}

export interface ISlackThreadStreamData extends ISlackStreamBase {
  channelId: string
  threadId: string
  page: string
  channel: string
  new: boolean
  placeholder: string
}

export interface ISlackIntegrationSettings {
  channels: string[]
}

export interface SlackGetChannelsInput {
  token: string
}

export interface SlackGetMessagesInput {
  channelId: string
  token: string
  page: string | undefined
  perPage: number | 100
}

export interface SlackGetMessagesInThreadsInput {
  channelId: string
  threadId: string
  token: string
  page: string | undefined
  perPage: number | 100
}

export interface SlackGetMembersInput {
  token: string
  teamId: string
  page: string | undefined
  perPage: number | 100
}

export interface SlackGetMemberInput {
  token: string
  userId: string
}

export interface SlackChannel {
  id: string
  name: string
  is_member?: boolean
  is_general: boolean
}

export interface SlackTeam {
  id: string
  name: string
  url: string
  domain: string
}

export type SlackChannels = SlackChannel[]

export interface SlackMessage {
  ts: string
  type: string
  text: string
  subtype?: string
  reactions?: any
  attachments?: any
  user: string
  thread_ts?: string
}

export type SlackMessages = SlackMessage[]

export interface SlackMember {
  id: string
  name: string
  tz_label: string
  is_bot: boolean
  profile: {
    title: string
    real_name: string
    image_72: string
    email: string
  }
}

export type SlackMembers = SlackMember[]

export interface SlackParsedResponse {
  records: any
  nextPage: string
}

export interface SlackGetMembersOutput extends SlackParsedResponse {
  records: SlackMembers | []
}

export interface SlackGetMemberOutput extends SlackParsedResponse {
  records: SlackMember
}
