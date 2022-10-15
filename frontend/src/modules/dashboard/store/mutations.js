export default {
  SET_FILTERS(state, payload) {
    state.filters.period =
      payload.period || state.filters.period || 7
    state.filters.platform =
      payload.platform || state.filters.platform || 'all'
  },
  SET_TRENDING_CONVERSATIONS(state, { rows, count }) {
    state.conversations.trending = rows
    state.conversations.total = count
  },
  SET_RECENT_ACTIVITIES(state, { rows, count }) {
    state.activities.recent = rows
    state.activities.total = count
  },
  SET_ACTIVE_MEMBERS(state, { rows }) {
    state.members.active = rows
  },
  SET_RECENT_MEMBERS(state, { rows, count }) {
    state.members.recent = rows
    state.members.total = count
  },
  SET_ACTIVE_ORGANIZATIONS(state, { rows }) {
    state.organizations.active = rows
  },
  SET_RECENT_ORGANIZATIONS(state, { rows, count }) {
    state.organizations.recent = rows
    state.organizations.total = count
  }
}
