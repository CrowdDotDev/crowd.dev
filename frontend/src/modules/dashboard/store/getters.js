export default {
  // Filters
  period: (state) => state.filters.period,
  platform: (state) => state.filters.platform,

  // CubeData
  cubeData: (state) => state.cubeData,

  // Conversations
  recentConversations: (state) => state.conversations.recent,
  conversations: (state) => state.conversations,

  // Activities
  recentActivities: (state) => state.activities.recent,
  activities: (state) => state.activities,

  // Members
  activeMembers: (state) => state.members.active,
  recentMembers: (state) => state.members.recent,
  members: (state) => state.members,

  // Organizations
  activeOrganizations: (state) => state.organizations.active,
  recentOrganizations: (state) => state.organizations.recent,
  organizations: (state) => state.organizations,
};
