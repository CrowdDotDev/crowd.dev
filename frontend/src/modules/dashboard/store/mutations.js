export default {
  SET_FILTERS(state, payload) {
    state.filters.period =
      payload.period || state.filters.period || 7
    state.filters.platform =
      payload.platform || state.filters.platform || 'all'
  },
  SET_TRENDING_CONVERSATIONS(state, payload) {
    state.conversations.trending = payload
  },
  SET_RECENT_ACTIVITIES(state, payload) {
    state.activities.recent = payload
  },
  SET_ACTIVE_MEMBERS(state, payload) {
    state.members.active = payload
  },
  SET_RECENT_MEMBERS(state, payload) {
    state.members.recent = payload
  },
  SET_ACTIVE_ORGANIZATIONS(state, payload) {
    state.organizations.active = payload
  },
  SET_RECENT_ORGANIZATIONS(state, payload) {
    state.organizations.recent = payload
  }
}
