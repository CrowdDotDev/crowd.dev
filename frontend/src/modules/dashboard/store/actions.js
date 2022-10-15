import { MemberService } from '@/modules/member/member-service'
import { OrganizationService } from '@/modules/organization/organization-service'
import { ActivityService } from '@/modules/activity/activity-service'
import { ConversationService } from '@/modules/conversation/conversation-service'

export default {
  // Set new filters & fetch new data
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

  // Fetch trending conversations
  async getTrendingConversations({ commit, state }) {
    state.conversations.loading = true
    return ConversationService.list(
      {
        platform:
          state.filters.platform !== 'all'
            ? state.filters.platform
            : undefined,
        activityCount: {
          gt: 4
        }
      },
      'activityCount_DESC',
      5,
      0
    )
      .then((data) => {
        commit('SET_TRENDING_CONVERSATIONS', data)
        return Promise.resolve(data)
      })
      .finally(() => {
        state.conversations.loading = false
      })
  },

  // Fetch recent activities
  async getRecentActivities({ commit, state }) {
    state.activities.loading = true
    return ActivityService.list(
      {
        platform:
          state.filters.platform !== 'all'
            ? state.filters.platform
            : undefined
      },
      'createdAt_ASC',
      20,
      0
    )
      .then((data) => {
        commit('SET_RECENT_ACTIVITIES', data)
        return Promise.resolve(data)
      })
      .finally(() => {
        state.activities.loading = false
      })
  },

  // Fetch members
  async getMembers({ dispatch }) {
    dispatch('getActiveMembers')
    dispatch('getRecentMembers')
  },

  // Fetch active members
  async getActiveMembers({ commit, state }) {
    state.members.loadingActive = true
    return MemberService.list(
      {
        activityCount: {
          gt: 100
        }
      },
      'createdAt_ASC',
      5,
      0,
      false
    )
      .then((data) => {
        commit('SET_ACTIVE_MEMBERS', data)
        return Promise.resolve(data)
      })
      .finally(() => {
        state.members.loadingActive = false
      })
  },

  // Fetch recent members
  async getRecentMembers({ commit, state }) {
    state.members.loadingRecent = true
    return MemberService.list(
      null,
      'createdAt_ASC',
      20,
      0,
      false
    )
      .then((data) => {
        commit('SET_RECENT_MEMBERS', data)
        return Promise.resolve(data)
      })
      .finally(() => {
        state.members.loadingRecent = false
      })
  },

  // Fetch all organizations
  async getOrganizations({ dispatch }) {
    dispatch('getActiveOrganizations')
    dispatch('getRecentOrganizations')
  },

  // Fetch active orgnizations
  async getActiveOrganizations({ commit, state }) {
    state.organizations.loadingActive = true
    return OrganizationService.list(
      {
        activityCount: {
          gt: 100
        }
      },
      'createdAt_ASC',
      5,
      0,
      false
    )
      .then((data) => {
        commit('SET_ACTIVE_ORGANIZATIONS', data)
        return Promise.resolve(data)
      })
      .finally(() => {
        state.organizations.loadingActive = false
      })
  },

  // Fetch recent organizations
  async getRecentOrganizations({ commit, state }) {
    state.organizations.loadingRecent = true
    return OrganizationService.list(
      null,
      'createdAt_ASC',
      20,
      0,
      false
    )
      .then((data) => {
        commit('SET_RECENT_ORGANIZATIONS', data)
        return Promise.resolve(data)
      })
      .finally(() => {
        state.organizations.loadingRecent = false
      })
  }
}
