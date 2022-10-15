export default {
  period: (state) => state.filters.period,
  platform: (state) => state.filters.platform,
  trendingConversations: (state) =>
    state.conversations.trending,
  recentActivities: (state) => state.activities.recent,
  activeMembers: (state) => state.members.active,
  recentMembers: (state) => state.members.recent,
  activeOrganizations: (state) =>
    state.organizations.active,
  recentOrganizations: (state) => state.organizations.recent
}
