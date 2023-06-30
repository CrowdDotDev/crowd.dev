<template>
  <div class="panel !p-6">
    <!-- header -->
    <app-dashboard-widget-header
      title="Members"
      :total-loading="members.loadingRecent"
      :total="members.total"
      :route="{ name: 'member' }"
      button-title="All members"
      report-name="Members report"
    />

    <div class="flex -mx-5 pt-7">
      <!-- new members -->
      <section class="px-5 w-1/2">
        <div class="flex">
          <div class="w-5/12">
            <!-- info -->
            <h6
              class="text-sm leading-5 font-semibold mb-1"
            >
              New members
            </h6>
            <app-dashboard-count
              :loading="members.loadingRecent"
              :query="newMembersCount"
            />
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="members.loadingRecent"
              v-loading="members.loadingRecent"
              class="app-page-spinner !relative chart-loading"
            />
            <app-dashboard-widget-chart
              v-else
              :datasets="datasets('new members')"
              :query="newMembersChart"
            />
          </div>
        </div>
        <div class="pt-8">
          <p
            class="text-2xs leading-5 font-semibold text-gray-400 pb-4 tracking-1 uppercase"
          >
            Most recent
          </p>
          <div v-if="members.loadingRecent">
            <app-dashboard-member-item
              v-for="el in 3"
              :key="el"
              class="mb-3"
              :loading="true"
            />
          </div>
          <div v-else>
            <app-dashboard-member-item
              v-for="member of recentMembers"
              :key="member.id"
              :show-badge="false"
              class="mb-3"
              :member="member"
            >
              <span
                v-if="
                  member.lastActivity
                    && getPlatformDetails(
                      member.lastActivity.platform,
                    )
                "
              >joined
                {{ formatDateToTimeAgo(member.joinedAt) }}
                on
                {{
                  getPlatformDetails(
                    member.lastActivity.platform,
                  ).name
                }}</span>
            </app-dashboard-member-item>
            <app-dashboard-empty-state
              v-if="recentMembers.length === 0"
              icon-class="ri-group-2-line"
              class="pt-6 pb-5"
            >
              No new members during this period
            </app-dashboard-empty-state>
            <div
              v-if="recentMembers.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'member',
                  query: filterQueryService().setQuery({
                    ...newAndActive.filter,
                    joinedDate: {
                      value: periodStartDate,
                      operator: 'gt',
                    },
                  }),
                }"
                class="text-sm leading-5 font-medium text-red"
              >
                View more
              </router-link>
            </div>
          </div>
        </div>
      </section>

      <!-- active members -->
      <section class="px-5 w-1/2">
        <div class="flex">
          <div class="w-5/12">
            <!-- info -->
            <h6
              class="text-sm leading-5 font-semibold mb-1"
            >
              Active members
            </h6>
            <app-dashboard-count
              :loading="members.loadingActive"
              :query="activeMembersCount"
            />
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="members.loadingActive"
              v-loading="members.loadingActive"
              class="app-page-spinner !relative chart-loading"
            />
            <app-dashboard-widget-chart
              v-else
              :datasets="datasets('active members')"
              :query="activeMembersChart"
            />
          </div>
        </div>
        <div class="pt-8">
          <p
            class="text-2xs leading-5 font-semibold text-gray-400 pb-4 tracking-1 uppercase"
          >
            Most active
          </p>
          <div v-if="members.loadingActive">
            <app-dashboard-member-item
              v-for="el in 3"
              :key="el"
              class="mb-3"
              :loading="true"
            />
          </div>
          <div v-else>
            <app-dashboard-member-item
              v-for="member of activeMembers"
              :key="member.id"
              class="mb-3"
              :member="member"
            >
              <span>{{ member.activityCount }}
                {{
                  +member.activityCount > 1
                    ? 'activities'
                    : 'activity'
                }}</span>
            </app-dashboard-member-item>
            <app-dashboard-empty-state
              v-if="activeMembers.length === 0"
              icon-class="ri-group-2-line"
              class="pt-6 pb-5"
            >
              No active members during this period
            </app-dashboard-empty-state>
            <div
              v-if="activeMembers.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'member',
                  query: filterQueryService().setQuery({
                    ...allMembers.filter,
                    lastActivityDate: {
                      value: periodStartDate,
                      operator: 'gt',
                    },
                  }),
                }"
                class="text-sm leading-5 font-medium text-red"
              >
                View more
              </router-link>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import moment from 'moment';
import {
  newMembersChart,
  activeMembersChart,
  activeMembersCount,
  newMembersCount,
} from '@/modules/dashboard/dashboard.cube';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { formatDateToTimeAgo } from '@/utils/date';
import AppDashboardEmptyState from '@/modules/dashboard/components/dashboard-empty-state.vue';
import AppDashboardWidgetHeader from '@/modules/dashboard/components/dashboard-widget-header.vue';
import AppDashboardWidgetChart from '@/modules/dashboard/components/dashboard-widget-chart.vue';
import { DAILY_GRANULARITY_FILTER } from '@/modules/widget/widget-constants';
import AppDashboardMemberItem from '@/modules/dashboard/components/member/dashboard-member-item.vue';
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import newAndActive from '@/modules/member/config/saved-views/views/new-and-active';
import allMembers from '@/modules/member/config/saved-views/views/all-members';

export default {
  name: 'AppDashboardMember',
  components: {
    AppDashboardWidgetChart,
    AppDashboardWidgetHeader,
    AppDashboardEmptyState,
    AppDashboardMemberItem,
    AppDashboardCount,
  },
  data() {
    return {
      newMembersChart,
      newMembersCount,
      activeMembersChart,
      activeMembersCount,
      formatDateToTimeAgo,
      filterQueryService,
      newAndActive,
      allMembers,
    };
  },
  computed: {
    ...mapGetters('dashboard', [
      'activeMembers',
      'recentMembers',
      'members',
      'period',
    ]),
    periodStartDate() {
      return moment()
        .subtract(this.period.value, 'day')
        .format('YYYY-MM-DD');
    },
  },
  methods: {
    datasets(name) {
      return [
        {
          name,
          borderColor: '#E94F2E',
          measure: 'Members.count',
          granularity: DAILY_GRANULARITY_FILTER.value,
        },
      ];
    },
    getPlatformDetails(platform) {
      return CrowdIntegrations.getConfig(platform);
    },
  },
};
</script>

<style lang="scss" scoped>
.chart-loading {
  @apply flex items-center justify-center;
  height: 112px;
}
.app-page-spinner {
  min-height: initial;
}
</style>
