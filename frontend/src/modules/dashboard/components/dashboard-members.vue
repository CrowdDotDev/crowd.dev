<template>
  <div class="panel !p-6">
    <!-- header -->
    <app-dashboard-widget-header
      title="Contacts"
      :total-loading="members.loadingRecent"
      :total="members.total"
      :route="{
        name: 'member',
        query: filterQueryService().setQuery(allContacts.config),
      }"
      button-title="All contacts"
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
              New contacts
            </h6>
            <app-dashboard-count
              :loading="!cube"
              :current-total="cube?.newMembers.total"
              :previous-total="cube?.newMembers.previousPeriodTotal"
            />
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="!cube"
              v-loading="!cube"
              class="app-page-spinner !relative chart-loading"
            />
            <app-dashboard-widget-chart
              v-else
              :data="cube?.newMembers.timeseries"
              :datasets="datasets('new members')"
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
                  getPlatformDetails(member.lastActivity.platform)?.name
                    ?? member.lastActivity.platform
                }}</span>
            </app-dashboard-member-item>
            <app-dashboard-empty-state
              v-if="recentMembers.length === 0"
              icon-class="ri-group-2-line"
              class="pt-6 pb-5"
            >
              No new contacts during this period
            </app-dashboard-empty-state>
            <div
              v-if="recentMembers.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'member',
                  query: filterQueryService().setQuery({
                    ...allContacts.config,
                    joinedDate: {
                      value: periodRange,
                      operator: 'between',
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
            <div class="inline-flex items-center gap-2 mb-1">
              <h6
                class="text-sm leading-5 font-semibold"
              >
                Active contacts
                <el-tooltip
                  placement="top"
                  content="Contacts for whom at least one activity was tracked in the selected time period."
                  popper-class="max-w-[260px]"
                >
                  <i class="ri-information-line text-sm ml-1 font-normal" />
                </el-tooltip>
              </h6>
            </div>

            <!-- info -->
            <app-dashboard-count
              :loading="!cube"
              :current-total="cube?.activeMembers.total"
              :previous-total="cube?.activeMembers.previousPeriodTotal"
            />
          </div>
          <div class="w-7/12 h-21">
            <!-- Chart -->
            <div
              v-if="!cube"
              v-loading="!cube"
              class="app-page-spinner !relative chart-loading"
            />
            <app-dashboard-widget-chart
              v-else
              :datasets="datasets('active members')"
              :data="cube?.activeMembers.timeseries"
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
              No active contacts during this period
            </app-dashboard-empty-state>
            <div
              v-if="activeMembers.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'member',
                  query: filterQueryService().setQuery({
                    ...allContacts.config,
                    lastActivityDate: {
                      value: periodRange,
                      operator: 'between',
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

<script lang="ts" setup>
import { formatDateToTimeAgo } from '@/utils/date';
import AppDashboardEmptyState from '@/modules/dashboard/components/dashboard-empty-state.vue';
import AppDashboardWidgetHeader from '@/modules/dashboard/components/dashboard-widget-header.vue';
import AppDashboardWidgetChart from '@/modules/dashboard/components/dashboard-widget-chart.vue';
import AppDashboardMemberItem from '@/modules/dashboard/components/member/dashboard-member-item.vue';
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import allContacts from '@/modules/member/config/saved-views/views/all-contacts';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { computed } from 'vue';
import moment from 'moment';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { DashboardCubeData } from '@/modules/dashboard/types/DashboardCubeData';

const {
  cubeData, members, period, activeMembers, recentMembers,
} = mapGetters('dashboard');

const cube = computed<DashboardCubeData>(() => cubeData.value);

const periodRange = computed(() => [
  moment()
    .utc()
    .subtract(period.value.value - 1, 'day')
    .format('YYYY-MM-DD'),
  moment()
    .utc()
    .format('YYYY-MM-DD'),
]);
const datasets = (name: string) => [{
  name,
  borderColor: '#E94F2E',
  measure: 'Members.count',
  granularity: 'day',
}];

const getPlatformDetails = (platform: string) => CrowdIntegrations.getConfig(platform);

</script>

<script lang="ts">
export default {
  name: 'CrDashboardMember',
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
