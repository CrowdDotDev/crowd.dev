import { MemberService } from '@/modules/member/member-service'

export default {
  async setFilters(
    { commit, dispatch },
    { period, platform }
  ) {
    commit('SET_FILTERS', {
      period,
      platform
    })
    dispatch('getMembers')
  },
  async getMembers({ dispatch }) {
    dispatch('getActiveMembers')
    dispatch('getRecentMembers')
  },
  async getActiveMembers({ commit }) {
    return MemberService.list(
      {
        activityCount: {
          gt: 100
        }
      },
      'createdAt_DESC',
      5,
      0,
      false
    ).then(({ rows }) => {
      commit('SET_ACTIVE_MEMBERS', rows)
      return Promise.resolve(rows)
    })
  },
  async getRecentMembers({ commit }) {
    return MemberService.list(
      null,
      'createdAt_DESC',
      20,
      0,
      false
    ).then(({ rows }) => {
      commit('SET_RECENT_MEMBERS', rows)
      return Promise.resolve(rows)
    })
  }
}
