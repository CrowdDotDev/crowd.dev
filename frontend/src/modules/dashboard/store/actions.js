import { MemberService } from '@/modules/member/member-service'
import { OrganizationService } from '@/modules/organization/organization-service'
import { ActivityService } from '@/modules/activity/activity-service'
import { ConversationService } from '@/modules/conversation/conversation-service'

export default {
  async setFilters(
    { commit, dispatch },
    { period, platform }
  ) {
    commit('SET_FILTERS', {
      period,
      platform
    })
    dispatch('getTrendingConversations')
    dispatch('getRecentActivities')
    dispatch('getMembers')
    dispatch('getOrganizations')
  },
  async getTrendingConversations({ commit }) {
    return ConversationService.list(
      {
        activityCount: {
          gt: 4
        }
      },
      'activityCount_DESC',
      5,
      0
    ).then(({ rows }) => {
      commit('SET_TRENDING_CONVERSATIONS', rows)
      return Promise.resolve(rows)
    })
  },
  async getRecentActivities({ commit }) {
    return ActivityService.list(
      null,
      'createdAt_ASC',
      20,
      0
    ).then(({ rows }) => {
      commit('SET_RECENT_ORGANIZATIONS', rows)
      return Promise.resolve(rows)
    })
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
  },

  // Fetch all organizations
  async getOrganizations({ dispatch }) {
    dispatch('getActiveOrganizations')
    dispatch('getRecentOrganizations')
  },
  async getActiveOrganizations({ commit }) {
    return OrganizationService.list(
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
      commit('SET_ACTIVE_ORGANIZATIONS', rows)
      return Promise.resolve(rows)
    })
  },
  async getRecentOrganizations({ commit }) {
    return OrganizationService.list(
      null,
      'createdAt_DESC',
      20,
      0,
      false
    ).then(({ rows }) => {
      commit('SET_RECENT_ORGANIZATIONS', rows)
      return Promise.resolve(rows)
    })
  }
}
