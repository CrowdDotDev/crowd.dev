export default {
  SET_FILTERS(state, payload) {
    state.filters.period =
      payload.period || state.filters.period || 7
    state.filters.platform =
      payload.platform || state.filters.platform || 'all'
  },
  SET_ACTIVE_MEMBERS(state, payload) {
    state.members.active = payload
  },
  SET_RECENT_MEMBERS(state, payload) {
    state.members.recent = payload
  }
}
