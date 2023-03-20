export enum PlatformType {
  DEVTO = 'devto',
  SLACK = 'slack',
  DISCORD = 'discord',
  GITHUB = 'github',
  TWITTER = 'twitter',
  REDDIT = 'reddit',
  HACKERNEWS = 'hackernews',
  LINKEDIN = 'linkedin',
  CROWD = 'crowd',
  ENRICHMENT = 'enrichment',
  HASHNODE = 'hashnode',
  KAGGLE = 'kaggle',
  MEDIUM = 'medium',
  PRODUCTHUNT = 'producthunt',
  YOUTUBE = 'youtube',
  STACKOVERFLOW = 'stackoverflow',
}

export const ALL_PLATFORM_TYPES = Object.keys(PlatformType) as PlatformType[]

export enum IntegrationType {
  DEVTO = 'devto',
  SLACK = 'slack',
  REDDIT = 'reddit',
  DISCORD = 'discord',
  GITHUB = 'github',
  TWITTER = 'twitter',
  TWITTER_REACH = 'twitter-reach',
  HACKER_NEWS = 'hackernews',
  LINKEDIN = 'linkedin',
  CROWD = 'crowd',
}
