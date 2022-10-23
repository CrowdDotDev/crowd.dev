<template>
  <div class="widget panel !p-6">
    <!-- header -->
    <div class="flex items-center">
      <div
        class="w-10 h-10 rounded-md bg-gray-900 flex items-center justify-center mr-4"
      >
        <i class="ri-radar-line text-xl text-white"></i>
      </div>
      <div>
        <h6 class="text-base font-semibold leading-5">
          Activities
        </h6>
      </div>
    </div>

    <div class="pt-6 flex -mx-5 pb-12">
      <div class="w-7/12 px-5 pb-4">
        <div
          v-if="activities.loading"
          v-loading="activities.loading"
          class="app-page-spinner h-16 !relative !min-h-5 chart-loading"
        ></div>
        <app-widget-cube-renderer
          v-else
          class="chart"
          :widget="activitiesChart(period, platform)"
          :dashboard="false"
          :show-subtitle="false"
          :chart-options="chartOptions"
        ></app-widget-cube-renderer>
      </div>
      <div class="w-5/12 px-5 pb-4">
        <p
          class="text-2xs leading-5 font-semibold text-gray-400 mb-3 tracking-1 uppercase"
        >
          Total
        </p>
        <app-dashboard-activity-count />
        <p
          class="text-2xs leading-5 font-semibold text-gray-400 mb-3 tracking-1 uppercase"
        >
          OVERALL SENTIMENT
        </p>
        <app-dashboard-activity-sentiment />
      </div>
    </div>

    <div class="tabs">
      <el-tabs v-model="tab">
        <el-tab-pane
          label="Trending conversations"
          name="trending"
        >
          <app-dashboard-conversation-list />
        </el-tab-pane>
        <el-tab-pane
          label="Recent activities"
          name="recent"
        >
          <app-dashboard-activity-list />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppWidgetCubeRenderer from '@/modules/widget/components/cube/widget-cube-renderer'
import {
  activitiesChart,
  chartOptions
} from '@/modules/dashboard/dashboard.cube'
import AppDashboardConversationList from '@/modules/dashboard/components/conversations/dashboard-conversation-list'
import AppDashboardActivityList from '@/modules/dashboard/components/activity/dashboard-activity-list'
import AppDashboardActivityCount from '@/modules/dashboard/components/activity/dashboard-activity-count'
import AppDashboardActivitySentiment from '@/modules/dashboard/components/activity/dashboard-activity-sentiment'
export default {
  name: 'AppDashboardActivities',
  components: {
    AppDashboardActivitySentiment,
    AppDashboardActivityCount,
    AppDashboardActivityList,
    AppDashboardConversationList,
    AppWidgetCubeRenderer
  },
  data() {
    return {
      tab: 'trending',
      hoveredSentiment: '',
      activitiesChart,
      chartOptions
    }
  },
  computed: {
    ...mapGetters('dashboard', [
      'period',
      'platform',
      'activities'
    ])
  }
}
</script>

<style scoped lang="scss">
.tabs::v-deep {
  .el-tabs__content {
    overflow: visible;
  }
}
.chart::v-deep {
  div {
    line-height: 150px !important;
    height: auto !important;
  }
}

.chart-loading {
  @apply flex items-center justify-center;
  height: 150px;
}
</style>
