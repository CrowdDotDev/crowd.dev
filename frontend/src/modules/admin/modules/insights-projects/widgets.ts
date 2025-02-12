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
      { name: 'Industry distribution', key: 'industryDistribution' },
    ],
  },
  {
    name: 'Popularity',
    widgets: [
      { name: 'Stars', key: 'stars' },
      { name: 'Forks', key: 'forks' },
      { name: 'Social mentions', key: 'socialMentions' },
      { name: 'GitHub mentions', key: 'githubMentions' },
      { name: 'Press mentions', key: 'pressMentions' },
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
