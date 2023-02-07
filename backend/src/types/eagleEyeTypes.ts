export enum EagleEyeActionType {
  THUMBS_UP = 'thumbs-up',
  THUMBS_DOWN = 'thumbs-down',
  BOOKMARK = 'bookmark',
}

export interface EagleEyeAction {
  id?: string
  type: EagleEyeActionType
  timestamp: Date | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface EagleEyeContent {
  id?: string
  platform: string
  post: any
  url: string
  actions?: EagleEyeAction[]
  tenantId: string
  postedAt: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface EagleEyeFeedSettings {
  keywords: string[]
  exactKeywords: string[]
  excludedKeywords: string[]
  publishedDate: string | Date
  platforms: string[]
}

export interface EagleEyeEmailDigestSettings {
  email: string
  frequency: 'daily' | 'weekly'
  time: string
  feed: EagleEyeFeedSettings
  matchFeedSettings: boolean
}

export interface EagleEyeSettings {
  onboarded: boolean
  feed: EagleEyeFeedSettings
  emailDigestActive: boolean
  emailDigest?: EagleEyeEmailDigestSettings
}

// Enum for EagleEyePlatforms
export enum EagleEyePlatforms {
  GITHUB = 'github',
  HACKERNEWS = 'hackernews',
  DEVTO = 'devto',
  REDDIT = 'reddit',
  MEDIUM = 'medium',
  STACKOVERFLOW = 'stackoverflow',
  TWITTER = 'twitter',
  YOUTUBE = 'youtube',
  PRODUCTHUNT = 'producthunt',
  KAGGLE = 'kaggle',
  HASHNODE = 'hashnode',
  LINKEDIN = 'linkedin',
}

export enum EagleEyePublishedDates {
  LAST_24_HOURS = 'Last 24h',
  LAST_7_DAYS = 'Last 7 days',
  LAST_14_DAYS = 'Last 14 days',
  LAST_30_DAYS = 'Last 30 days',
  LAST_90_DAYS = 'Last 90 days',
}
