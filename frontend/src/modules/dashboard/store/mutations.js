export default {
  SET_FILTERS(state, payload) {
    state.filters.period =
      payload.period || state.filters.period || 7
    state.filters.platform =
      payload.platform || state.filters.platform || 'all'
  }
}
