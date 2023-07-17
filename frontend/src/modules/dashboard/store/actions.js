import moment from 'moment';
import { MemberService } from '@/modules/member/member-service';
import { OrganizationService } from '@/modules/organization/organization-service';
import { ActivityService } from '@/modules/activity/activity-service';
import { ConversationService } from '@/modules/conversation/conversation-service';
import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants';
import { DEFAULT_ACTIVITY_FILTERS } from '@/modules/activity/store/constants';
import { DEFAULT_ORGANIZATION_FILTERS } from '@/modules/organization/store/constants';
import { DEFAULT_MEMBER_FILTERS } from '@/modules/member/store/constants';

export default {
  async reset({ dispatch }) {
    dispatch('setFilters', {
      period: SEVEN_DAYS_PERIOD_FILTER,
      platform: 'all',
    });
  },

  setSegments({ commit, dispatch }, { segments }) {
    commit('SET_SEGMENTS', { segments });

    dispatch('getConversations');
    dispatch('getActivities');
    dispatch('getMembers');
    dispatch('getOrganizations');
  },

  // Set new filters & fetch new data
  async setFilters(
    { commit, dispatch },
    { period, platform },
  ) {
    commit('SET_FILTERS', {
      period,
      platform,
    });
    dispatch('getConversations');
    dispatch('getActivities');
    dispatch('getMembers');
    dispatch('getOrganizations');
  },
  // fetch conversations data
  async getConversations({ dispatch }) {
    dispatch('getTrendingConversations');
    // dispatch('getConversationCount');
  },
  // Fetch trending conversations
  async getTrendingConversations({ commit, state }) {
    state.conversations.loading = true;

    const { platform, period, segments } = state.filters;

    return ConversationService.query({
      filter: {
        and: [
          {
            lastActive: {
              gte: moment()
                .startOf('day')
                .subtract(
                  period.granularity === 'day'
                    ? period.value - 1
                    : period.value,
                  period.granularity,
                )
                .toISOString(),
            },
          },
          ...(platform !== 'all'
            ? [
              {
                platform: {
                  eq: platform,
                },
              },
            ]
            : []),
        ],
      },
      orderBy: 'lastActive_DESC',
      limit: 5,
      offset: 0,
      segments: segments.childSegments,
    })
      .then((data) => {
        commit('SET_TRENDING_CONVERSATIONS', data);
        return Promise.resolve(data);
      })
      .finally(() => {
        state.conversations.loading = false;
      });
  },
  // fetch conversations total
  async getConversationCount({ state }) {
    const { segments } = state.filters;

    return ConversationService.query({
      filter: {},
      orderBy: '',
      limit: 1,
      offset: 0,
      segments: segments.childSegments,
    })
      .then(({ count }) => {
        state.conversations.total = count;
        return Promise.resolve(count);
      })
      .finally(() => {
        state.conversations.loading = false;
      });
  },

  // fetch activities data
  async getActivities({ dispatch }) {
    dispatch('getActivitiesCount');
    dispatch('getRecentActivities');
  },
  // Fetch recent activities
  async getRecentActivities({ commit, state }) {
    state.activities.loading = true;
    const { platform, period, segments } = state.filters;

    return ActivityService.query({
      filter: {
        ...DEFAULT_ACTIVITY_FILTERS,
        and: [
          {
            timestamp: {
              gte: moment()
                .startOf('day')
                .subtract(
                  period.granularity === 'day'
                    ? period.value - 1
                    : period.value,
                  period.granularity,
                )
                .toISOString(),
            },
          },
          ...(platform !== 'all'
            ? [
              {
                platform,
              },
            ]
            : []),
        ],
      },
      orderBy: 'timestamp_DESC',
      limit: 20,
      offset: 0,
      segments: segments.childSegments,
    })
      .then((data) => {
        commit('SET_RECENT_ACTIVITIES', data);
        return Promise.resolve(data);
      })
      .finally(() => {
        state.activities.loading = false;
      });
  },

  // Fetch activities count
  async getActivitiesCount({ state }) {
    const { platform, segments } = state.filters;

    return ActivityService.query({
      filter: (platform === 'all'
        ? DEFAULT_ACTIVITY_FILTERS
        : {
          ...DEFAULT_ACTIVITY_FILTERS,
          and: [
            ...(platform !== 'all'
              ? [
                {
                  platform,
                },
              ]
              : []),
          ],
        }),
      orderBy: '',
      limit: 1,
      offset: 0,
      segments: segments.childSegments,
    })
      .then(({ count }) => {
        state.activities.total = count;
        return Promise.resolve(count);
      })
      .finally(() => {
        state.activities.loading = false;
      });
  },

  // Fetch members
  async getMembers({ dispatch }) {
    dispatch('getMembersCount');
    dispatch('getActiveMembers');
    dispatch('getRecentMembers');
  },

  // Fetch active members
  async getActiveMembers({ commit, state }) {
    const { platform, period, segments } = state.filters;

    state.members.loadingActive = true;

    return MemberService.listActive({
      platform: platform !== 'all' ? [{ value: platform }] : [],
      isTeamMember: false,
      activityIsContribution: null,
      activityTimestampFrom: moment()
        .utc()
        .subtract(period.value, period.granularity)
        .toISOString(),
      activityTimestampTo: moment().utc(),
      orderBy: 'activityCount_DESC',
      offset: 0,
      limit: 5,
      segments: segments.segments,
    })
      .then((data) => {
        commit('SET_ACTIVE_MEMBERS', data);
        return Promise.resolve(data);
      })
      .finally(() => {
        state.members.loadingActive = false;
      });
  },

  // Fetch recent members
  async getRecentMembers({ commit, state }) {
    state.members.loadingRecent = true;
    const { platform, period, segments } = state.filters;

    return MemberService.listMembers({
      filter: {
        and: [
          ...DEFAULT_MEMBER_FILTERS,
          {
            joinedAt: {
              gte: moment()
                .startOf('day')
                .subtract(
                  period.granularity === 'day'
                    ? period.value - 1
                    : period.value,
                  period.granularity,
                )
                .toISOString(),
            },
          },
          ...(platform !== 'all'
            ? [
              {
                identities: {
                  contains: [platform],
                },
              },
            ]
            : []),
        ],
      },
      orderBy: 'joinedAt_DESC',
      limit: 5,
      offset: 0,
      segments: segments.segments,
    })
      .then((data) => {
        commit('SET_RECENT_MEMBERS', data);
        return Promise.resolve(data);
      })
      .finally(() => {
        state.members.loadingRecent = false;
      });
  },

  // Fetch members count
  async getMembersCount({ state }) {
    const { platform, segments } = state.filters;

    return MemberService.listMembers({
      filter: (platform === 'all' ? {
        and: DEFAULT_MEMBER_FILTERS,
      }
        : {
          and: [
            ...DEFAULT_MEMBER_FILTERS,
            ...(platform !== 'all'
              ? [
                {
                  identities: {
                    contains: [platform],
                  },
                },
              ]
              : []),
          ],
        }),
      orderBy: '',
      limit: 1,
      offset: 0,
      segments: segments.segments,
    }, true)
      .then(({ count }) => {
        state.members.total = count;
        return Promise.resolve(count);
      })
      .finally(() => {
        state.members.loadingRecent = false;
      });
  },

  // Fetch all organizations
  async getOrganizations({ dispatch }) {
    dispatch('getOrganizationsCount');
    dispatch('getActiveOrganizations');
    dispatch('getRecentOrganizations');
  },

  // Fetch active orgnizations
  async getActiveOrganizations({ commit, state }) {
    state.organizations.loadingActive = true;
    const { platform, period, segments } = state.filters;

    return OrganizationService.query({
      filter: {
        and: [
          ...DEFAULT_ORGANIZATION_FILTERS,
          {
            lastActive: {
              gte: moment()
                .startOf('day')
                .subtract(
                  period.granularity === 'day'
                    ? period.value - 1
                    : period.value,
                  period.granularity,
                )
                .toISOString(),
            },
          },
          ...(platform !== 'all'
            ? [
              {
                activeOn: {
                  contains: [platform],
                },
              },
            ]
            : []),
        ],
      },
      orderBy: 'lastActive_DESC',
      limit: 5,
      offset: 0,
      segments: segments.childSegments,
    })
      .then((data) => {
        commit('SET_ACTIVE_ORGANIZATIONS', data);
        return Promise.resolve(data);
      })
      .finally(() => {
        state.organizations.loadingActive = false;
      });
  },

  // Fetch recent organizations
  async getRecentOrganizations({ commit, state }) {
    state.organizations.loadingRecent = true;
    const { platform, period, segments } = state.filters;

    return OrganizationService.query({
      filter: {
        and: [
          ...DEFAULT_ORGANIZATION_FILTERS,
          {
            joinedAt: {
              gte: moment()
                .startOf('day')
                .subtract(
                  period.granularity === 'day'
                    ? period.value - 1
                    : period.value,
                  period.granularity,
                )
                .toISOString(),
            },
          },
          ...(platform !== 'all'
            ? [
              {
                identities: {
                  contains: [platform],
                },
              },
            ]
            : []),
        ],
      },
      orderBy: 'createdAt_DESC',
      limit: 5,
      offset: 0,
      segments: segments.childSegments,
    })
      .then((data) => {
        commit('SET_RECENT_ORGANIZATIONS', data);
        return Promise.resolve(data);
      })
      .finally(() => {
        state.organizations.loadingRecent = false;
      });
  },

  // Fetch  organizations count
  async getOrganizationsCount({ state }) {
    const { platform, segments } = state.filters;

    return OrganizationService.query({
      filter: (platform === 'all' ? {
        and: DEFAULT_ORGANIZATION_FILTERS,
      }
        : {
          and: [
            ...DEFAULT_ORGANIZATION_FILTERS,
            ...(platform !== 'all'
              ? [
                {
                  identities: {
                    contains: [platform],
                  },
                },
              ]
              : []),
          ],
        }),
      orderBy: '',
      limit: 1,
      offset: 0,
      segments: segments.childSegments,
    })
      .then(({ count }) => {
        state.organizations.total = count;
        return Promise.resolve(count);
      })
      .finally(() => {
        state.organizations.loadingRecent = false;
      });
  },
};
