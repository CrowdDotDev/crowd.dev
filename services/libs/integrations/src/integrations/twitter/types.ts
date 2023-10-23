export enum TwitterActivityType {
  HASHTAG = 'hashtag',
  MENTION = 'mention',
  FOLLOW = 'follow',
}

export enum TwitterStreamType {
  MENTIONS = 'mentions',
  HASHTAG = 'hashtag',
}

export interface TwitterPlatformSettings {
  clientId: string
  clientSecret: string
  callbackUrl: string
}

export interface TwitterIntegrationsSettings {
  hashtags?: string[]
}

export interface TwitterMentionsStreamData {
  page: string
}

export interface TwitterHashtagStreamData {
  hashtag: string
  page: string
}
