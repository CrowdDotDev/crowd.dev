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
  page: string | undefined
  perPage: number | 100
}

export interface SlackChannel {
  id: string
  name: string
  is_member?: boolean
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

export interface SlackParsedReponse {
  records: any
  nextPage: string
  limit: number
  timeUntilReset: number
}

export interface SlackGetChannelsOutput extends SlackParsedReponse {
  records: SlackChannels
}

export interface SlackGetMessagesOutput extends SlackParsedReponse {
  records: SlackMessages | []
}

export interface SlackGetMembersOutput extends SlackParsedReponse {
  records: SlackMembers | []
}
