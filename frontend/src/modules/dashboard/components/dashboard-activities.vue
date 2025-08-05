<template>
  <div class="widget panel !p-6">
    <!-- header -->
    <app-dashboard-widget-header
      title="Activities"
      :total-loading="activities.loading"
      :total="activities.total"
      :route="{
        name: 'activity',
        hash: '#activity',
        query: filterQueryService().setQuery(allActivitiesFilter),
      }"
      button-title="All activities"
    />

    <div class="pt-6 flex -mx-5 pb-12">
      <section class="px-5 w-1/2">
        <div class="flex">
          <div class="w-5/12">
            <!-- info -->
            <h6
              class="text-sm leading-5 font-semibold mb-1"
            >
              New activities
            </h6>
            <app-dashboard-count
              :loading="!chartData"
              :current-total="chartData?.activity.total"
              :previous-total="chartData?.activity.previousPeriodTotal"
            />
          </div>
          <div class="w-7/12">
            <div
              v-if="!chartData"
              v-loading="!chartData"
              class="app-page-spinner h-16 !relative !min-h-5 chart-loading"
            />
            <lf-chart
              v-else-if="chartData?.activity.timeseries?.length"
              :config="lfxCharts.dashboardAreaChart"
              :data="mapData(chartData?.activity.timeseries)"
              :params="{ label: 'new activities' }"
            />
          </div>
        </div>
        <div class="pt-10">
          <app-dashboard-activity-sentiment />
        </div>
      </section>
      <section class="px-5 w-1/2">
        <h6 class="text-sm leading-5 font-semibold mb-4">
          Top activities by type
        </h6>
        <app-dashboard-activity-types />
      </section>
    </div>

    <div class="dashboard-tabs">
      <el-tabs v-model="tab">
        <el-tab-pane
          label="Recent activities"
          name="recentActivities"
        >
          <app-dashboard-activity-list />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AppDashboardActivityTypes from '@/modules/dashboard/components/activity/dashboard-activity-types.vue';
import AppDashboardWidgetHeader from '@/modules/dashboard/components/dashboard-widget-header.vue';
import AppDashboardActivityList from '@/modules/dashboard/components/activity/dashboard-activity-list.vue';
import AppDashboardActivitySentiment from '@/modules/dashboard/components/activity/dashboard-activity-sentiment.vue';
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { lfxCharts } from '@/config/charts';
import LfChart from '@/ui-kit/chart/Chart.vue';

const {
  chartData, activities,
} = mapGetters('dashboard');

const mapData = (data: any[]) => data.map((item) => ({
  label: item.date,
  value: item.count,
}));

const allActivitiesFilter = ({
  search: '',
  relation: 'and',
  order: {
    prop: 'timestamp',
    order: 'descending',
  },
});
</script>

<script lang="ts">
export default {
  name: 'AppDashboardActivities',
};
</script>

<style lang="scss">
.chart-loading {
  @apply flex items-center justify-center;
  height: 112px;
}
.app-page-spinner {
  min-height: initial;
}
.dashboard-tabs {
  .el-tabs__content {
    @apply -mx-6 #{!important};
  }
}
</style>
