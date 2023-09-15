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
  DISCOURSE = 'discourse',
  GIT = 'git',
  CRUNCHBASE = 'crunchbase',
  HUBSPOT = 'hubspot',
  GROUPSIO = 'groupsio',
  OTHER = 'other',
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
  STACKOVERFLOW = 'stackoverflow',
  DISCOURSE = 'discourse',
  GIT = 'git',
  HUBSPOT = 'hubspot',
}

export const integrationLabel: Record<IntegrationType, string> = {
  [IntegrationType.DEVTO]: 'DEV',
  [IntegrationType.SLACK]: 'Slack',
  [IntegrationType.REDDIT]: 'Reddit',
  [IntegrationType.DISCORD]: 'Discord',
  [IntegrationType.GITHUB]: 'GitHub',
  [IntegrationType.TWITTER]: 'Twitter',
  [IntegrationType.TWITTER_REACH]: 'Twitter',
  [IntegrationType.HACKER_NEWS]: 'Hacker news',
  [IntegrationType.LINKEDIN]: 'LinkedIn',
  [IntegrationType.CROWD]: 'Crowd',
  [IntegrationType.STACKOVERFLOW]: 'Stack Overflow',
  [IntegrationType.DISCOURSE]: 'Discourse',
  [IntegrationType.GIT]: 'Git',
  [IntegrationType.HUBSPOT]: 'HubSpot',
}

// Backup url from username if profile url not present in member.attributes.url
export const integrationProfileUrl: Record<IntegrationType, (username: string) => string | null> = {
  [IntegrationType.DEVTO]: (username) => `https://dev.to/${username}`,
  [IntegrationType.SLACK]: (username) => `https://slack.com/${username}`,
  [IntegrationType.REDDIT]: (username) => `https://reddit.com/user/${username}`,
  [IntegrationType.DISCORD]: (username) => `https://discord.com/${username}`,
  [IntegrationType.GITHUB]: (username) => `https://github.com/${username}`,
  [IntegrationType.TWITTER]: (username) => `https://twitter.com/${username}`,
  [IntegrationType.TWITTER_REACH]: (username) => `https://twitter.com/${username}`,
  [IntegrationType.HACKER_NEWS]: (username) => `https://news.ycombinator.com/user?id=${username}`,
  [IntegrationType.LINKEDIN]: (username) =>
    !username?.includes('private-') ? `https://linkedin.com/in/${username}` : null,
  [IntegrationType.CROWD]: () => null,
  [IntegrationType.STACKOVERFLOW]: (username) => `https://stackoverflow.com/users/${username}`,
  [IntegrationType.DISCOURSE]: () => null,
  [IntegrationType.GIT]: () => null,
  [IntegrationType.HUBSPOT]: () => null,
}
