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
      report-name="Activities report"
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
              :loading="!cube"
              :current-total="cube?.activity.total"
              :previous-total="cube?.activity.previousPeriodTotal"
            />
          </div>
          <div class="w-7/12">
            <div
              v-if="!cube"
              v-loading="!cube"
              class="app-page-spinner h-16 !relative !min-h-5 chart-loading"
            />

            <app-dashboard-widget-chart
              v-else
              :datasets="datasets"
              :data="cube?.activity.timeseries"
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
          label="Recent conversations"
          name="recentConversations"
        >
          <app-dashboard-conversation-list />
        </el-tab-pane>
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
import AppDashboardWidgetChart from '@/modules/dashboard/components/dashboard-widget-chart.vue';
import AppDashboardConversationList from '@/modules/dashboard/components/conversations/dashboard-conversation-list.vue';
import AppDashboardActivityList from '@/modules/dashboard/components/activity/dashboard-activity-list.vue';
import AppDashboardActivitySentiment from '@/modules/dashboard/components/activity/dashboard-activity-sentiment.vue';
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import { computed, ref } from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { DashboardCubeData } from '@/modules/dashboard/types/DashboardCubeData';

const {
  cubeData, activities,
} = mapGetters('dashboard');

const cube = computed<DashboardCubeData>(() => cubeData.value);

const tab = ref('recentConversations');

const datasets = [{
  name: 'new activities',
  borderColor: '#E94F2E',
  measure: 'Activities.count',
  granularity: 'day',
}];

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
