export default {
  period: (state) => state.filters.period,
  platform: (state) => state.filters.platform,
  activeMembers: (state) => state.members.active,
  recentMembers: (state) => state.members.recent
}
