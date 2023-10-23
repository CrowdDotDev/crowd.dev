export enum TwitterActivityType {
  HASHTAG = 'hashtag',
  MENTION = 'mention',
  FOLLOW = 'follow',
}

export enum TwitterStreamType {
  MENTIONS = 'mentions',
  HASHTAG = 'hashtag',
}

export interface TwitterPublishData {
  type: TwitterStreamType
  data: TwitterParsedPost
  hashtag?: string
}

export interface TwitterPlatformSettings {
  clientId: string
  clientSecret: string
  callbackUrl: string
  maxRetrospectInSeconds: string
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

export interface TwitterGetPostsByHashtagInput {
  hashtag: string
  token: string
  page: string | undefined
  perPage: number | 100
}

export interface TwitterGetPostsByMentionInput {
  profileId: string
  token: string
  page: string | undefined
  perPage: number | 100
}

export interface TwitterGetFollowersInput {
  profileId: string
  token: string
  page: string | undefined
  perPage: number | 100
}

export interface TwitterGetProfilesByUsernameInput {
  usernames: string[]
  token: string
}

export interface TwitterPost {
  id: string
  text: string
  author_id: string
  created_at: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  referenced_tweets?: any
  attachments?: {
    media_keys: string[]
  }
}

export type TwitterPosts = TwitterPost[]

export interface TwitterMember {
  url: string
  verified: boolean
  username: string
  public_metrics: {
    followers_count: number
    following_count: number
    tweet_count: number
    listed_count: number
  }
  name: string
  description?: string
  id: string
  location?: string
  profile_image_url?: string
}

export interface TwitterParsedPost extends TwitterPost {
  member: TwitterMember
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entities: any
}

export type TwitterParsedPosts = TwitterParsedPost[]

export type TwitterMembers = TwitterMember[]

export interface TwitterParsedReponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  records: any
  nextPage: string
  limit: number
  timeUntilReset: number
}

export interface TwitterGetPostsOutput extends TwitterParsedReponse {
  records: TwitterParsedPosts | []
}

export interface TwitterGetFollowersOutput extends TwitterParsedReponse {
  records: TwitterMembers | []
}
