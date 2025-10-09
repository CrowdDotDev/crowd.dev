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
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue';
import AppDashboardWidgetHeader from '@/modules/dashboard/components/dashboard-widget-header.vue';
import allOrganizations from '@/modules/organization/config/saved-views/views/all-organizations';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { lfxCharts } from '@/config/charts';
import LfChart from '@/ui-kit/chart/Chart.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const {
  chartData, organizations,
} = mapGetters('dashboard');

const mapData = (data: any[]) => data.map((item) => ({
  label: item.date,
  value: item.count,
}));
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
