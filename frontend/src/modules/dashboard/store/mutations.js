export default {
  SET_FILTERS(state, payload) {
    state.filters.period =
      payload.period || state.filters.period || 7
    state.filters.platform =
      payload.platform || state.filters.platform || 'all'
  },
  SET_TRENDING_CONVERSATIONS(state, { rows }) {
    state.conversations.trending = rows
  },
  SET_RECENT_ACTIVITIES(state, { rows }) {
    state.activities.recent = rows
  },
  SET_ACTIVE_MEMBERS(state, { rows }) {
    state.members.active = rows
  },
  SET_RECENT_MEMBERS(state, { rows }) {
    state.members.recent = rows
  },
  SET_ACTIVE_ORGANIZATIONS(state, { rows }) {
    state.organizations.active = rows
  },
  SET_RECENT_ORGANIZATIONS(state, { rows }) {
    state.organizations.recent = rows
  }
}
