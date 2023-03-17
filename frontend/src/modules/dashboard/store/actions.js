import { MemberService } from '@/modules/member/member-service'
import { OrganizationService } from '@/modules/organization/organization-service'
import { ActivityService } from '@/modules/activity/activity-service'
import { ConversationService } from '@/modules/conversation/conversation-service'
import moment from 'moment'
import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants'

export default {
  async reset({ dispatch }) {
    dispatch('setFilters', {
      period: SEVEN_DAYS_PERIOD_FILTER,
      platform: 'all'
    })
  },

  // Set new filters & fetch new data
  async setFilters(
    { commit, dispatch },
    { period, platform }
  ) {
    commit('SET_FILTERS', {
      period,
      platform
    })
    dispatch('getConversations')
    dispatch('getActivities')
    dispatch('getMembers')
    dispatch('getOrganizations')
  },
  // fetch conversations data
  async getConversations({ dispatch }) {
    dispatch('getTrendingConversations')
    // dispatch('getConversationCount')
  },
  // Fetch trending conversations
  async getTrendingConversations({ commit, state }) {
    state.conversations.loading = true
    const { platform, period } = state.filters
    return ConversationService.query(
      {
        and: [
          {
            lastActive: {
              gte: moment()
                .startOf('day')
                .subtract(
                  period.granularity === 'day'
                    ? period.value - 1
                    : period.value,
                  period.granularity
                )
                .toISOString()
            }
          },
          ...(platform !== 'all'
            ? [
                {
                  platform: {
                    eq: platform
                  }
                }
              ]
            : [])
        ]
      },
      'lastActive_DESC',
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
  // fetch conversations total
  async getConversationCount({ state }) {
    return ConversationService.list({}, '', 1, 0)
      .then(({ count }) => {
        state.conversations.total = count
        return Promise.resolve(count)
      })
      .finally(() => {
        state.conversations.loading = false
      })
  },

  // fetch activities data
  async getActivities({ dispatch }) {
    dispatch('getActivitiesCount')
    dispatch('getRecentActivities')
  },
  // Fetch recent activities
  async getRecentActivities({ commit, state }) {
    state.activities.loading = true
    const { platform, period } = state.filters
    return ActivityService.list(
      {
        and: [
          {
            timestamp: {
              gte: moment()
                .startOf('day')
                .subtract(
                  period.granularity === 'day'
                    ? period.value - 1
                    : period.value,
                  period.granularity
                )
                .toISOString()
            }
          },
          ...(platform !== 'all'
            ? [
                {
                  platform: platform
                }
              ]
            : [])
        ]
      },
      'timestamp_DESC',
      20,
      0,
      false
    )
      .then((data) => {
        commit('SET_RECENT_ACTIVITIES', data)
        return Promise.resolve(data)
      })
      .finally(() => {
        state.activities.loading = false
      })
  },
  // Fetch activities count
  async getActivitiesCount({ state }) {
    return ActivityService.list({}, '', 1, 0)
      .then(({ count }) => {
        state.activities.total = count
        return Promise.resolve(count)
      })
      .finally(() => {
        state.activities.loading = false
      })
  },

  // Fetch members
  async getMembers({ dispatch }) {
    dispatch('getMembersCount')
    dispatch('getActiveMembers')
    dispatch('getRecentMembers')
  },

  // Fetch active members
  async getActiveMembers({ commit, state }) {
    const { platform, period } = state.filters
    state.members.loadingActive = true
    return MemberService.list(
      {
        and: [
          {
            lastActive: {
              gte: moment()
                .startOf('day')
                .subtract(
                  period.granularity === 'day'
                    ? period.value - 1
                    : period.value,
                  period.granularity
                )
                .toISOString()
            },
            isTeamMember: {
              not: true
            }
          },
          ...(platform !== 'all'
            ? [
                {
                  activeOn: {
                    contains: [platform]
                  }
                }
              ]
            : [])
        ]
      },
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
    const { platform, period } = state.filters
    return MemberService.list(
      {
        and: [
          {
            joinedAt: {
              gte: moment()
                .startOf('day')
                .subtract(
                  period.granularity === 'day'
                    ? period.value - 1
                    : period.value,
                  period.granularity
                )
                .toISOString()
            }
          },
          ...(platform !== 'all'
            ? [
                {
                  identities: {
                    contains: [platform]
                  }
                }
              ]
            : [])
        ]
      },
      'joinedAt_DESC',
      5,
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
  // Fetch members count
  async getMembersCount({ state }) {
    return MemberService.list(null, '', 1, 0, false, true)
      .then(({ count }) => {
        state.members.total = count
        return Promise.resolve(count)
      })
      .finally(() => {
        state.members.loadingRecent = false
      })
  },

  // Fetch all organizations
  async getOrganizations({ dispatch }) {
    dispatch('getOrganizationsCount')
    dispatch('getActiveOrganizations')
    dispatch('getRecentOrganizations')
  },

  // Fetch active orgnizations
  async getActiveOrganizations({ commit, state }) {
    state.organizations.loadingActive = true
    const { platform, period } = state.filters
    return OrganizationService.list(
      {
        and: [
          {
            lastActive: {
              gte: moment()
                .startOf('day')
                .subtract(
                  period.granularity === 'day'
                    ? period.value - 1
                    : period.value,
                  period.granularity
                )
                .toISOString()
            }
          },
          ...(platform !== 'all'
            ? [
                {
                  activeOn: {
                    contains: [platform]
                  }
                }
              ]
            : [])
        ]
      },
      'lastActive_DESC',
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
    const { platform, period } = state.filters
    return OrganizationService.list(
      {
        and: [
          {
            joinedAt: {
              gte: moment()
                .startOf('day')
                .subtract(
                  period.granularity === 'day'
                    ? period.value - 1
                    : period.value,
                  period.granularity
                )
                .toISOString()
            }
          },
          ...(platform !== 'all'
            ? [
                {
                  identities: {
                    contains: [platform]
                  }
                }
              ]
            : [])
        ]
      },
      'createdAt_DESC',
      5,
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
  },

  // Fetch  organizations count
  async getOrganizationsCount({ state }) {
    return OrganizationService.list(null, '', 1, 0, false)
      .then(({ count }) => {
        state.organizations.total = count
        return Promise.resolve(count)
      })
      .finally(() => {
        state.organizations.loadingRecent = false
      })
  }
}
