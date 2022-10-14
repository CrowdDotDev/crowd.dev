export default {
  async setFilters({ commit }, { period, platform }) {
    commit('SET_FILTERS', {
      period,
      platform
    })
  }
}
