<template>
  <div class="widget panel !p-5" v-bind="$attrs">
    <!-- header -->
    <app-dashboard-widget-header
      title="Organizations"
      :total-loading="organizations.loadingRecent"
      :total="organizations.total"
      :route="{
        name: 'organization',
        query: filterQueryService().setQuery(allOrganizations.config),
      }"
      button-title="All organizations"
    />

    <div class="flex -mx-5 pt-7">
      <section class="px-5 w-1/2">
        <div class="flex">
          <div class="w-5/12">
            <!-- info -->
            <h6
              class="text-sm leading-5 font-semibold mb-1"
            >
              New organizations
            </h6>
            <app-dashboard-count
              :loading="!chartData"
              :current-total="chartData?.newOrganizations.total"
              :previous-total="chartData?.newOrganizations.previousPeriodTotal"
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
              v-else-if="chartData?.newOrganizations.timeseries?.length"
              :config="lfxCharts.dashboardAreaChart"
              :data="mapData(chartData?.newOrganizations.timeseries)"
              :params="{ label: 'new organizations' }"
            />
          </div>
        </div>
        <div class="pt-8">
          <p
            class="text-2xs leading-5 font-semibold text-gray-400 pb-4 tracking-1 uppercase"
          >
            Most recent
          </p>
          <div v-if="organizations.loadingRecent">
            <app-dashboard-organization-item
              v-for="el in 3"
              :key="el"
              class="mb-4"
              :loading="true"
            />
          </div>
          <div v-else>
            <app-dashboard-organization-item
              v-for="organization of recentOrganizations"
              :key="organization.id"
              :show-badge="false"
              class="mb-4"
              :organization="organization"
            />
            <app-dashboard-empty-state
              v-if="recentOrganizations.length === 0"
              icon="building"
              class="pt-6 pb-5"
            >
              No new organizations during this period
            </app-dashboard-empty-state>
            <div
              v-if="recentOrganizations.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'organization',
                  query: filterQueryService().setQuery({
                    ...allOrganizations.config,
                    joinedDate: {
                      value: periodRange,
                      operator: 'between',
                    },
                    projectGroup: selectedProjectGroup?.id,
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

      <section class="px-5 w-1/2">
        <div class="flex">
          <div class="w-5/12">
            <div class="flex items-center gap-2 mb-1">
              <h6
                class="text-sm leading-5 font-semibold"
              >
                Active <span>organizations</span>
                <el-tooltip
                  placement="top"
                  content="Organizations whose people engaged in at least one activity during the selected time period."
                  popper-class="max-w-[260px]"
                >
                  <lf-icon name="circle-info" :size="14" class="ml-1" />
                </el-tooltip>
              </h6>
            </div>
            <!-- info -->
            <app-dashboard-count
              :loading="!chartData"
              :current-total="chartData?.activeOrganizations.total"
              :previous-total="chartData?.activeOrganizations.previousPeriodTotal"
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
              v-else-if="chartData?.activeOrganizations.timeseries?.length"
              :config="lfxCharts.dashboardAreaChart"
              :data="mapData(chartData?.activeOrganizations.timeseries)"
              :params="{ label: 'active organizations' }"
            />
          </div>
        </div>
        <div class="pt-8">
          <p
            class="text-2xs leading-5 font-semibold text-gray-400 pb-4 tracking-1 uppercase"
          >
            Most active
          </p>
          <div v-if="organizations.loadingActive">
            <app-dashboard-organization-item
              v-for="el in 3"
              :key="el"
              class="mb-4"
              :loading="true"
            />
          </div>
          <div v-else>
            <app-dashboard-organization-item
              v-for="organization of activeOrganizations"
              :key="organization.id"
              class="mb-4"
              :organization="organization"
            />
            <app-dashboard-empty-state
              v-if="activeOrganizations.length === 0"
              icon="building"
              class="pt-6 pb-5"
            >
              No active organizations during this period
            </app-dashboard-empty-state>
            <div
              v-if="activeOrganizations.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'organization',
                  query: filterQueryService().setQuery({
                    ...allOrganizations.config,
                    lastActivityDate: {
                      value: periodRange,
                      operator: 'between',
                    },
                    projectGroup: selectedProjectGroup?.id,
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
import AppDashboardOrganizationItem from '@/modules/dashboard/components/organization/dashboard-organization-item.vue';
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue';
import AppDashboardEmptyState from '@/modules/dashboard/components/dashboard-empty-state.vue';
import AppDashboardWidgetHeader from '@/modules/dashboard/components/dashboard-widget-header.vue';
import allOrganizations from '@/modules/organization/config/saved-views/views/all-organizations';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import { computed } from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { lfxCharts } from '@/config/charts';
import LfChart from '@/ui-kit/chart/Chart.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { dateHelper } from '@/shared/date-helper/date-helper';

const {
  chartData, organizations, period, activeOrganizations, recentOrganizations,
} = mapGetters('dashboard');

const mapData = (data: any[]) => data.map((item) => ({
  label: item.date,
  value: item.count,
}));

const periodRange = computed(() => [
  dateHelper()
    .utc()
    .subtract(period.value - 1, 'day')
    .format('YYYY-MM-DD'),
  dateHelper()
    .utc()
    .format('YYYY-MM-DD'),
]);
</script>

<script lang="ts">
export default {
  name: 'AppDashboardOrganizations',
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
