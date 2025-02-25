export const WIDGETS_GROUPS = [
  {
    name: 'Contributors',
    widgets: [
      { name: 'Active contributors', key: 'activeContributors' },
      { name: 'Active organization', key: 'activeOrganization' },
      { name: 'Contributors leaderboard', key: 'contributorsLeaderboard' },
      { name: 'Organizations leaderboard', key: 'organizationsLeaderboard' },
      { name: 'Contributor dependency', key: 'contributorDependency' },
      { name: 'Organization dependency', key: 'organizationDependency' },
      { name: 'Retention', key: 'retention' },
      { name: 'Geographical distribution', key: 'geographicalDistribution' },
    ],
  },
  {
    name: 'Popularity',
    widgets: [
      { name: 'Stars', key: 'stars' },
      { name: 'Forks', key: 'forks' },
    ],
  },
  {
    name: 'Development',
    widgets: [
      { name: 'Issues resolution', key: 'issuesResolution' },
      { name: 'Pull requests', key: 'pullRequests' },
      {
        name: 'Contributions outside work hours',
        key: 'contributionsOutsideWorkHours',
      },
      { name: 'Merge lead time', key: 'mergeLeadTime' },
      {
        name: 'Review time by pull request size',
        key: 'reviewTimeByPullRequestSize',
      },
      { name: 'Average time to merge', key: 'averageTimeToMerge' },
      { name: 'Wait time for 1st review', key: 'waitTimeFor1stReview' },
      { name: 'Code review engagement', key: 'codeReviewEngagement' },
    ],
  },
];

export const defaultWidgetsValues = {
  activeContributors: true,
  activeOrganization: true,
  contributorsLeaderboard: true,
  organizationsLeaderboard: true,
  contributorDependency: true,
  organizationDependency: true,
  retention: true,
  geographicalDistribution: true,
  industryDistribution: true,
  stars: true,
  forks: true,
  socialMentions: true,
  githubMentions: true,
  pressMentions: true,
};
