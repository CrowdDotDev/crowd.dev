import { Platform } from '@/shared/modules/platform/types/Platform';

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

export const WIDGETS_GROUPS = [
  {
    name: 'Contributors',
    widgets: [
      {
        name: 'Active contributors',
        key: Widgets.ACTIVE_CONTRIBUTORS,
      },
      {
        name: 'Active organization',
        key: Widgets.ACTIVE_ORGANIZATION,
      },
      {
        name: 'Contributors leaderboard',
        key: Widgets.CONTRIBUTORS_LEADERBOARD,
      },
      {
        name: 'Organizations leaderboard',
        key: Widgets.ORGANIZATIONS_LEADERBOARD,
      },
      {
        name: 'Contributor dependency',
        key: Widgets.CONTRIBUTOR_DEPENDENCY,
      },
      {
        name: 'Organization dependency',
        key: Widgets.ORGANIZATION_DEPENDENCY,
      },
      {
        name: 'Retention',
        key: Widgets.RETENTION,
      },
      {
        name: 'Geographical distribution',
        key: Widgets.GEOGRAPHICAL_DISTRIBUTION,
      },
    ],
  },
  {
    name: 'Popularity',
    widgets: [
      {
        name: 'Stars',
        key: Widgets.STARS,
      },
      {
        name: 'Forks',
        key: Widgets.FORKS,
      },
      // {
      //   name: 'Social mentions',
      //   key: Widgets.SOCIAL_MENTIONS,
      // },
      // {
      //   name: 'GitHub Mentions',
      //   key: Widgets.GITHUB_MENTIONS,
      // },
      // {
      //   name: 'Press mentions',
      //   key: Widgets.PRESS_MENTIONS,
      // },
      // {
      //   name: 'Search queries',
      //   key: Widgets.SEARCH_QUERIES,
      // },
      {
        name: 'Package downloads',
        key: Widgets.PACKAGE_DOWNLOADS,
      },
      {
        name: 'Package dependency',
        key: Widgets.PACKAGE_DEPENDENCY,
      },
      {
        name: 'Mailing lists messages',
        key: Widgets.MAILING_LIST_MESSAGES,
      },
    ],
  },
  {
    name: 'Development',
    widgets: [
      {
        name: 'Issues resolution',
        key: Widgets.ISSUES_RESOLUTION,
      },
      {
        name: 'Commit activities',
        key: Widgets.COMMIT_ACTIVITIES,
      },
      {
        name: 'Pull requests',
        key: Widgets.PULL_REQUESTS,
      },
      {
        name: 'Active days',
        key: Widgets.ACTIVE_DAYS,
      },
      {
        name: 'Contributions outside work hours',
        key: Widgets.CONTRIBUTIONS_OUTSIDE_WORK_HOURS,
      },
      {
        name: 'Merge lead time',
        key: Widgets.MERGE_LEAD_TIME,
      },
      {
        name: 'Review time by pull request size',
        key: Widgets.REVIEW_TIME_BY_PULL_REQUEST_SIZE,
      },
      {
        name: 'Average time to merge',
        key: Widgets.AVERAGE_TIME_TO_MERGE,
      },
      {
        name: 'Wait time for 1st review',
        key: Widgets.WAIT_TIME_FOR_1ST_REVIEW,
      },
      {
        name: 'Code review engagement',
        key: Widgets.CODE_REVIEW_ENGAGEMENT,
      },
    ],
  },
];

export const defaultWidgetsValues: Record<
  Widgets,
  {
    enabled: boolean
    platform: Platform[]
  }
> = {
  // Contributors
  [Widgets.ACTIVE_CONTRIBUTORS]: {
    enabled: true,
    platform: [Platform.ALL],
  },
  [Widgets.ACTIVE_ORGANIZATION]: {
    enabled: true,
    platform: [Platform.ALL],
  },
  [Widgets.CONTRIBUTORS_LEADERBOARD]: {
    enabled: true,
    platform: [Platform.ALL],
  },
  [Widgets.ORGANIZATIONS_LEADERBOARD]: {
    enabled: true,
    platform: [Platform.ALL],
  },
  [Widgets.CONTRIBUTOR_DEPENDENCY]: {
    enabled: true,
    platform: [Platform.ALL],
  },
  [Widgets.ORGANIZATION_DEPENDENCY]: {
    enabled: true,
    platform: [Platform.ALL],
  },
  [Widgets.RETENTION]: {
    enabled: true,
    platform: [Platform.ALL],
  },
  [Widgets.GEOGRAPHICAL_DISTRIBUTION]: {
    enabled: true,
    platform: [Platform.ALL],
  },
  // Popularity
  [Widgets.STARS]: {
    enabled: true,
    platform: [Platform.GITHUB, Platform.GITHUB_NANGO],
  },
  [Widgets.FORKS]: {
    enabled: true,
    platform: [Platform.GITHUB, Platform.GITHUB_NANGO],
  },
  // [Widgets.SOCIAL_MENTIONS]: {
  //   enabled: false,
  //   platform: [Platform.ALL],
  // },
  // [Widgets.GITHUB_MENTIONS]: {
  //   enabled: false,
  //   platform: [Platform.ALL],
  // },
  // [Widgets.PRESS_MENTIONS]: {
  //   enabled: false,
  //   platform: [Platform.ALL],
  // },
  // [Widgets.SEARCH_QUERIES]: {
  //   enabled: false,
  //   platform: [Platform.ALL],
  // },
  [Widgets.PACKAGE_DOWNLOADS]: {
    enabled: true,
    platform: [Platform.GITHUB, Platform.GITHUB_NANGO],
  },
  [Widgets.PACKAGE_DEPENDENCY]: {
    enabled: true,
    platform: [Platform.GITHUB, Platform.GITHUB_NANGO],
  },
  [Widgets.MAILING_LIST_MESSAGES]: {
    enabled: true,
    platform: [Platform.GROUPS_IO],
  },
  // Development
  [Widgets.ISSUES_RESOLUTION]: {
    enabled: true,
    platform: [Platform.GITLAB, Platform.GITHUB, Platform.JIRA, Platform.GITHUB_NANGO],
  },
  [Widgets.COMMIT_ACTIVITIES]: {
    enabled: true,
    platform: [Platform.GIT, Platform.GITHUB, Platform.GITLAB, Platform.GITHUB_NANGO],
  },
  [Widgets.PULL_REQUESTS]: {
    enabled: true,
    platform: [Platform.GITHUB, Platform.GITLAB, Platform.GITHUB_NANGO],
  },
  [Widgets.ACTIVE_DAYS]: {
    enabled: true,
    platform: [Platform.ALL],
  },
  [Widgets.CONTRIBUTIONS_OUTSIDE_WORK_HOURS]: {
    enabled: true,
    platform: [Platform.ALL],
  },
  [Widgets.MERGE_LEAD_TIME]: {
    enabled: true,
    platform: [Platform.GITHUB, Platform.GITLAB, Platform.GITHUB_NANGO],
  },
  [Widgets.REVIEW_TIME_BY_PULL_REQUEST_SIZE]: {
    enabled: true,
    platform: [Platform.GITHUB, Platform.GITLAB, Platform.GITHUB_NANGO],
  },
  [Widgets.AVERAGE_TIME_TO_MERGE]: {
    enabled: true,
    platform: [Platform.GITHUB, Platform.GITLAB, Platform.GITHUB_NANGO],
  },
  [Widgets.WAIT_TIME_FOR_1ST_REVIEW]: {
    enabled: true,
    platform: [Platform.GITHUB, Platform.GITLAB, Platform.GITHUB_NANGO],
  },
  [Widgets.CODE_REVIEW_ENGAGEMENT]: {
    enabled: true,
    platform: [Platform.GITHUB, Platform.GITLAB, Platform.GITHUB_NANGO],
  },
};
