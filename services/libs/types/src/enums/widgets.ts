import { ALL_PLATFORM_TYPES, PlatformType } from './platforms'

export enum Widgets {
  ACTIVE_CONTRIBUTORS = 'activeContributors',
  ACTIVE_ORGANIZATION = 'activeOrganization',
  CONTRIBUTORS_LEADERBOARD = 'contributorsLeaderboard',
  ORGANIZATIONS_LEADERBOARD = 'organizationsLeaderboard',
  CONTRIBUTOR_DEPENDENCY = 'contributorDependency',
  ORGANIZATION_DEPENDENCY = 'organizationDependency',
  RETENTION = 'retention',
  GEOGRAPHICAL_DISTRIBUTION = 'geographicalDistribution',
  STARS = 'stars',
  FORKS = 'forks',
  // SOCIAL_MENTIONS = 'socialMentions',
  // GITHUB_MENTIONS = 'githubMentions',
  // PRESS_MENTIONS = 'pressMentions',
  SEARCH_QUERIES = 'searchQueries',
  PACKAGE_DOWNLOADS = 'packageDownloads',
  PACKAGE_DEPENDENCY = 'packageDependency',
  MAILING_LIST_MESSAGES = 'mailingListMessages',
  ISSUES_RESOLUTION = 'issuesResolution',
  COMMIT_ACTIVITIES = 'commitActivities',
  PULL_REQUESTS = 'pullRequests',
  ACTIVE_DAYS = 'activeDays',
  CONTRIBUTIONS_OUTSIDE_WORK_HOURS = 'contributionsOutsideWorkHours',
  MERGE_LEAD_TIME = 'mergeLeadTime',
  REVIEW_TIME_BY_PULL_REQUEST_SIZE = 'reviewTimeByPullRequestSize',
  AVERAGE_TIME_TO_MERGE = 'averageTimeToMerge',
  WAIT_TIME_FOR_1ST_REVIEW = 'waitTimeFor1stReview',
  CODE_REVIEW_ENGAGEMENT = 'codeReviewEngagement',
}

export const DEFAULT_WIDGET_VALUES: Record<
  Widgets,
  {
    enabled: boolean
    platform: PlatformType[]
  }
> = {
  // Contributors
  [Widgets.ACTIVE_CONTRIBUTORS]: {
    enabled: true,
    platform: ALL_PLATFORM_TYPES,
  },
  [Widgets.ACTIVE_ORGANIZATION]: {
    enabled: true,
    platform: ALL_PLATFORM_TYPES,
  },
  [Widgets.CONTRIBUTORS_LEADERBOARD]: {
    enabled: true,
    platform: ALL_PLATFORM_TYPES,
  },
  [Widgets.ORGANIZATIONS_LEADERBOARD]: {
    enabled: true,
    platform: ALL_PLATFORM_TYPES,
  },
  [Widgets.CONTRIBUTOR_DEPENDENCY]: {
    enabled: true,
    platform: ALL_PLATFORM_TYPES,
  },
  [Widgets.ORGANIZATION_DEPENDENCY]: {
    enabled: true,
    platform: ALL_PLATFORM_TYPES,
  },
  [Widgets.RETENTION]: {
    enabled: true,
    platform: ALL_PLATFORM_TYPES,
  },
  [Widgets.GEOGRAPHICAL_DISTRIBUTION]: {
    enabled: true,
    platform: ALL_PLATFORM_TYPES,
  },
  // Popularity
  [Widgets.STARS]: {
    enabled: true,
    platform: [PlatformType.GITHUB, PlatformType.GITHUB_NANGO],
  },
  [Widgets.FORKS]: {
    enabled: true,
    platform: [PlatformType.GITHUB, PlatformType.GITHUB_NANGO],
  },
  // [Widgets.SOCIAL_MENTIONS]: {
  //   enabled: false,
  //   platform: [ALL_PLATFORM_TYPES],
  // },
  // [Widgets.GITHUB_MENTIONS]: {
  //   enabled: false,
  //   platform: [ALL_PLATFORM_TYPES],
  // },
  // [Widgets.PRESS_MENTIONS]: {
  //   enabled: false,
  //   platform: [ALL_PLATFORM_TYPES],
  // },
  [Widgets.SEARCH_QUERIES]: {
    enabled: true,
    platform: ALL_PLATFORM_TYPES,
  },
  [Widgets.PACKAGE_DOWNLOADS]: {
    enabled: true,
    platform: [PlatformType.GITHUB, PlatformType.GITHUB_NANGO],
  },
  [Widgets.PACKAGE_DEPENDENCY]: {
    enabled: true,
    platform: [PlatformType.GITHUB, PlatformType.GITHUB_NANGO],
  },
  [Widgets.MAILING_LIST_MESSAGES]: {
    enabled: true,
    platform: [PlatformType.GROUPSIO],
  },
  // Development
  [Widgets.ISSUES_RESOLUTION]: {
    enabled: true,
    platform: [
      PlatformType.GITLAB,
      PlatformType.GITHUB,
      PlatformType.JIRA,
      PlatformType.GITHUB_NANGO,
    ],
  },
  [Widgets.COMMIT_ACTIVITIES]: {
    enabled: true,
    platform: [
      PlatformType.GIT,
      PlatformType.GITHUB,
      PlatformType.GITLAB,
      PlatformType.GITHUB_NANGO,
    ],
  },
  [Widgets.PULL_REQUESTS]: {
    enabled: true,
    platform: [PlatformType.GITHUB, PlatformType.GITLAB, PlatformType.GITHUB_NANGO],
  },
  [Widgets.ACTIVE_DAYS]: {
    enabled: true,
    platform: ALL_PLATFORM_TYPES,
  },
  [Widgets.CONTRIBUTIONS_OUTSIDE_WORK_HOURS]: {
    enabled: true,
    platform: ALL_PLATFORM_TYPES,
  },
  [Widgets.MERGE_LEAD_TIME]: {
    enabled: true,
    platform: [PlatformType.GITHUB, PlatformType.GITLAB, PlatformType.GITHUB_NANGO],
  },
  [Widgets.REVIEW_TIME_BY_PULL_REQUEST_SIZE]: {
    enabled: true,
    platform: [PlatformType.GITHUB, PlatformType.GITLAB, PlatformType.GITHUB_NANGO],
  },
  [Widgets.AVERAGE_TIME_TO_MERGE]: {
    enabled: true,
    platform: [PlatformType.GITHUB, PlatformType.GITLAB, PlatformType.GITHUB_NANGO],
  },
  [Widgets.WAIT_TIME_FOR_1ST_REVIEW]: {
    enabled: true,
    platform: [PlatformType.GITHUB, PlatformType.GITLAB, PlatformType.GITHUB_NANGO],
  },
  [Widgets.CODE_REVIEW_ENGAGEMENT]: {
    enabled: true,
    platform: [PlatformType.GITHUB, PlatformType.GITLAB, PlatformType.GITHUB_NANGO],
  },
}
