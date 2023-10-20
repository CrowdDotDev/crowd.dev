export enum TwitterActivityType {
  HASHTAG = 'hashtag',
  MENTION = 'mention',
  FOLLOW = 'follow',
}

export interface TwitterPlatformSettings {
  clientId: string
  clientSecret: string
  callbackUrl: string
}
