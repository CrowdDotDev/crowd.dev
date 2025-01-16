<template>
  <div class="panel !p-6">
    <!-- header -->
    <app-dashboard-widget-header
      title="People"
      :total-loading="members.loadingRecent"
      :total="members.total"
      :route="{
        name: 'member',
        query: filterQueryService().setQuery(allMembers.config),
      }"
      button-title="All people"
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
              New people
            </h6>
            <app-dashboard-count
              :loading="!chartData"
              :current-total="chartData?.newMembers.total"
              :previous-total="chartData?.newMembers.previousPeriodTotal"
            />
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="!chartData"
              v-loading="!chartData"
              class="app-page-spinner !relative chart-loading"
            />
            <lf-chart
              v-else-if="chartData?.newMembers.timeseries?.length"
              :config="lfxCharts.dashboardAreaChart"
              :data="mapData(chartData?.newMembers.timeseries)"
              :params="{ label: 'new people' }"
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
                "
              >joined
                {{ formatDateToTimeAgo(member.joinedAt) }}
                on
                {{
                  lfIdentities[member.lastActivity.platform]?.name
                    ?? member.lastActivity.platform
                }}</span>
            </app-dashboard-member-item>
            <app-dashboard-empty-state
              v-if="recentMembers.length === 0"
              icon="user-group-simple"
              class="pt-6 pb-5"
            >
              No new people during this period
            </app-dashboard-empty-state>
            <div
              v-if="recentMembers.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'member',
                  query: filterQueryService().setQuery({
                    ...allMembers.config,
                    joinedDate: {
                      value: periodRange,
                      operator: 'between',
                    },
                    projectGroup: selectedProjectGroup?.id,
                  }),
                }"
                class="text-sm leading-5 font-medium  hover:underline"
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
            <div class="inline-flex items-center mb-1">
              <h6
                class="text-sm leading-5 font-semibold"
              >
                Active people
              </h6>
              <el-tooltip
                placement="top"
                content="People for whom at least one activity was tracked in the selected time period."
                popper-class="max-w-[260px]"
              >
                <lf-icon
                  name="circle-info"
                  class="ml-1"
                  :size="13"
                />
              </el-tooltip>
            </div>

            <!-- info -->
            <app-dashboard-count
              :loading="!chartData"
              :current-total="chartData?.activeMembers.total"
              :previous-total="chartData?.activeMembers.previousPeriodTotal"
            />
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="!chartData"
              v-loading="!chartData"
              class="app-page-spinner !relative chart-loading"
            />
            <lf-chart
              v-else-if="chartData?.activeMembers.timeseries?.length"
              :config="lfxCharts.dashboardAreaChart"
              :data="mapData(chartData?.activeMembers.timeseries)"
              :params="{ label: 'active people' }"
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
              icon="user-group-simple"
              class="pt-6 pb-5"
            >
              No active people during this period
            </app-dashboard-empty-state>
            <div
              v-if="activeMembers.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'member',
                  query: filterQueryService().setQuery({
                    ...allMembers.config,
                    lastActivityDate: {
                      value: periodRange,
                      operator: 'between',
                    },
                  }),
                }"
                class="text-sm leading-5 font-medium hover:underline"
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

<script lang="ts" setup>
import { computed } from 'vue';
import moment from 'moment';
import { formatDateToTimeAgo } from '@/utils/date';
import AppDashboardEmptyState from '@/modules/dashboard/components/dashboard-empty-state.vue';
import AppDashboardWidgetHeader from '@/modules/dashboard/components/dashboard-widget-header.vue';
import AppDashboardMemberItem from '@/modules/dashboard/components/member/dashboard-member-item.vue';
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import allMembers from '@/modules/member/config/saved-views/views/all-members';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { lfxCharts } from '@/config/charts';
import LfChart from '@/ui-kit/chart/Chart.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { lfIdentities } from '@/config/identities';

const {
  chartData, members, period, activeMembers, recentMembers,
} = mapGetters('dashboard');

const mapData = (data: any[]) => data.map((item) => ({
  label: item.date,
  value: item.count,
}));

const periodRange = computed(() => [
  moment()
    .utc()
    .subtract(period.value - 1, 'day')
    .format('YYYY-MM-DD'),
  moment()
    .utc()
    .format('YYYY-MM-DD'),
]);

</script>

<script lang="ts">
export default {
  name: 'LfDashboardMember',
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
