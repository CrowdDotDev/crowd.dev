import { MemberService } from '@/modules/member/member-service'
import { OrganizationService } from '@/modules/organization/organization-service'
import { ActivityService } from '@/modules/activity/activity-service'
import { ConversationService } from '@/modules/conversation/conversation-service'
import moment from 'moment'

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
    const platform = state.filters.platform
    const period = state.filters.period
    return ConversationService.list(
      {
        createdAtRange: [
          moment().subtract(period, 'day').toISOString(),
          moment().toISOString()
        ],
        platform: platform !== 'all' ? platform : undefined
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
    const platform = state.filters.platform
    const period = state.filters.period
    return ActivityService.list(
      {
        timestampRange: [
          moment().subtract(period, 'day').toISOString(),
          moment().toISOString()
        ],
        platform: platform !== 'all' ? platform : undefined
      },
      '',
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
      {},
      'activityCount_DESC',
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
    return MemberService.list(null, '', 20, 0, false)
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
          gt: 4
        }
      },
      '',
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
    return OrganizationService.list(null, '', 20, 0, false)
      .then((data) => {
        commit('SET_RECENT_ORGANIZATIONS', data)
        return Promise.resolve(data)
      })
      .finally(() => {
        state.organizations.loadingRecent = false
      })
  }
}
