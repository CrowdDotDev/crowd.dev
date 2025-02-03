import dayjs from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc';
import { MemberService } from '@/modules/member/member-service';
import { OrganizationService } from '@/modules/organization/organization-service';
import { ActivityService } from '@/modules/activity/activity-service';
import { ConversationService } from '@/modules/conversation/conversation-service';
import { DEFAULT_ACTIVITY_FILTERS } from '@/modules/activity/store/constants';
import { DEFAULT_ORGANIZATION_FILTERS } from '@/modules/organization/store/constants';
import { DEFAULT_MEMBER_FILTERS } from '@/modules/member/store/constants';
import { DashboardApiService } from '@/modules/dashboard/services/dashboard.api.service';

dayjs.extend(utcPlugin);
export default {
  async reset({ dispatch }) {
    dispatch('setFilters', {});
  },

  // Set new filters & fetch new data
  async setFilters(
    { commit, dispatch },
    { period, platform, segments },
  ) {
    commit('SET_FILTERS', {
      period,
      platform,
      segments,
    });
    dispatch('getChartData');
    dispatch('getConversations');
    dispatch('getActivities');
    dispatch('getMembers');
    dispatch('getOrganizations');
  },
  // Fetch chart data
  getChartData({ state }) {
    state.chartData = null;
    const { platform, period, segments } = state.filters;
    const [segment] = segments.segments;
    return DashboardApiService.fetchChartData({
      period: period.label,
      platform: platform !== 'all' ? platform : undefined,
      segment,
    })
      .then((data) => {
        console.log('data', data);
        const customData = {
          newMembers: {
            total: 0,
            previousPeriodTotal: 1,
            timeseries: [
              {
                date: '2025-01-28',
                count: 0,
              },
              {
                date: '2025-01-29',
                count: 0,
              },
              {
                date: '2025-01-30',
                count: 0,
              },
              {
                date: '2025-01-31',
                count: 0,
              },
              {
                date: '2025-02-01',
                count: 0,
              },
              {
                date: '2025-02-02',
                count: 0,
              },
              {
                date: '2025-02-03',
                count: 0,
              },
              {
                date: '2025-02-04',
                count: 0,
              },
            ],
          },
          activeMembers: {
            total: 35,
            previousPeriodTotal: 246,
            timeseries: [
              {
                date: '2025-01-28',
                count: 24,
              },
              {
                date: '2025-01-29',
                count: 11,
              },
              {
                date: '2025-01-30',
                count: 0,
              },
              {
                date: '2025-01-31',
                count: 0,
              },
              {
                date: '2025-02-01',
                count: 0,
              },
              {
                date: '2025-02-02',
                count: 0,
              },
              {
                date: '2025-02-03',
                count: 0,
              },
              {
                date: '2025-02-04',
                count: 0,
              },
            ],
          },
          newOrganizations: {
            total: 1,
            previousPeriodTotal: 1,
            timeseries: [
              {
                date: '2025-01-28',
                count: 1,
              },
              {
                date: '2025-01-29',
                count: 0,
              },
              {
                date: '2025-01-30',
                count: 0,
              },
              {
                date: '2025-01-31',
                count: 0,
              },
              {
                date: '2025-02-01',
                count: 0,
              },
              {
                date: '2025-02-02',
                count: 0,
              },
              {
                date: '2025-02-03',
                count: 0,
              },
              {
                date: '2025-02-04',
                count: 0,
              },
            ],
          },
          activeOrganizations: {
            total: 8,
            previousPeriodTotal: 0,
            timeseries: [
              {
                date: '2025-01-28',
                count: 0,
              },
              {
                date: '2025-01-29',
                count: 0,
              },
              {
                date: '2025-01-30',
                count: 0,
              },
              {
                date: '2025-01-31',
                count: 0,
              },
              {
                date: '2025-02-01',
                count: 0,
              },
              {
                date: '2025-02-02',
                count: 0,
              },
              {
                date: '2025-02-03',
                count: 8,
              },
              {
                date: '2025-02-04',
                count: 0,
              },
            ],
          },
          activity: {
            total: 92,
            previousPeriodTotal: 657,
            timeseries: [
              {
                count: 110,
                date: '2025-01-21 00:00:00.000000',
              },
              {
                count: 100,
                date: '2025-01-22 00:00:00.000000',
              },
              {
                count: 67,
                date: '2025-01-23 00:00:00.000000',
              },
              {
                count: 72,
                date: '2025-01-24 00:00:00.000000',
              },
              {
                count: 78,
                date: '2025-01-25 00:00:00.000000',
              },
              {
                count: 95,
                date: '2025-01-26 00:00:00.000000',
              },
              {
                count: 135,
                date: '2025-01-27 00:00:00.000000',
              },
            ],
            bySentimentMood: [
              {
                count: 8,
                sentimentLabel: 'negative',
              },
              {
                count: 131,
                sentimentLabel: 'positive',
              },
              {
                count: 87,
                sentimentLabel: 'neutral',
              },
            ],
            byTypeAndPlatform: [
              {
                count: 86,
                platform: 'github',
                type: 'pull_request-comment',
              },
              {
                count: 85,
                platform: 'github',
                type: 'authored-commit',
              },
              {
                count: 62,
                platform: 'github',
                type: 'pull_request-opened',
              },
              {
                count: 55,
                platform: 'github',
                type: 'pull_request-merged',
              },
              {
                count: 54,
                platform: 'github',
                type: 'pull_request-review-thread-comment',
              },
              {
                count: 42,
                platform: 'github',
                type: 'pull_request-reviewed',
              },
              {
                count: 42,
                platform: 'git',
                type: 'authored-commit',
              },
              {
                count: 42,
                platform: 'git',
                type: 'committed-commit',
              },
              {
                count: 40,
                platform: 'github',
                type: 'star',
              },
              {
                count: 38,
                platform: 'github',
                type: 'issue-comment',
              },
              {
                count: 28,
                platform: 'github',
                type: 'fork',
              },
              {
                count: 25,
                platform: 'git',
                type: 'signed-off-commit',
              },
              {
                count: 21,
                platform: 'github',
                type: 'issues-opened',
              },
              {
                count: 11,
                platform: 'github',
                type: 'pull_request-closed',
              },
              {
                count: 9,
                platform: 'github',
                type: 'discussion-comment',
              },
              {
                count: 7,
                platform: 'git',
                type: 'co-authored-commit',
              },
              {
                count: 7,
                platform: 'github',
                type: 'issues-closed',
              },
              {
                count: 3,
                platform: 'github',
                type: 'unstar',
              },
            ],
          },
        };
        state.chartData = customData;
        return Promise.resolve(customData);
      });
  },

  // fetch conversations data
  async getConversations({ dispatch }) {
    dispatch('getRecentConversations');
    dispatch('getConversationCount');
  },
  // Fetch recent conversations
  async getRecentConversations({ commit, state }) {
    state.conversations.loading = true;

    const { platform, period, segments } = state.filters;

    return ConversationService.query({
      filter: {
        and: [
          {
            lastActive: {
              gte: dayjs()
                .utc()
                .startOf('day')
                .subtract(
                  period.value - 1,
                  period.granularity,
                )
                .toISOString(),
            },
          },
          {
            lastActive: {
              lte: dayjs()
                .utc()
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
      orderBy: 'lastActive_DESC',
      limit: 20,
      offset: 0,
      segments: segments.childSegments,
    })
      .then((data) => {
        commit('SET_RECENT_CONVERSATIONS', data);
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
      countOnly: true,
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
              gte: dayjs()
                .utc()
                .startOf('day')
                .subtract(
                  period.value - 1,
                  period.granularity,
                )
                .toISOString(),
            },
          },
          {
            timestamp: {
              lte: dayjs()
                .utc()
                .toISOString(),
            },
          },
          ...(platform !== 'all'
            ? [
              {
                platform: { in: [platform] },
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
                  platform: { in: [platform] },
                },
              ]
              : []),
          ],
        }),
      orderBy: '',
      limit: 1,
      offset: 0,
      segments: segments.childSegments,
    }, true)
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
      activityTimestampFrom: dayjs()
        .utc()
        .subtract(period.value - 1, period.granularity)
        .startOf('day')
        .toISOString(),
      activityTimestampTo: dayjs().utc().endOf('day'),
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
              gte: dayjs()
                .utc()
                .startOf('day')
                .subtract(
                  period.value - 1,
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

    return OrganizationService.listActive({
      platform: platform !== 'all' ? [{ value: platform }] : [],
      isTeamOrganization: false,
      activityTimestampFrom: dayjs()
        .utc()
        .subtract(period.value - 1, period.granularity)
        .startOf('day')
        .toISOString(),
      activityTimestampTo: dayjs().utc().endOf('day'),
      orderBy: 'activityCount_DESC',
      offset: 0,
      limit: 5,
      segments: segments.segments,
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
              gte: dayjs()
                .utc()
                .startOf('day')
                .subtract(
                  period.value - 1,
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
