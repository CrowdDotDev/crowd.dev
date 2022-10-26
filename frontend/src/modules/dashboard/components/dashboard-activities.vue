<template>
  <div class="widget panel !p-6">
    <!-- header -->
    <div class="flex items-center">
      <div
        class="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center mr-3"
      >
        <i class="ri-radar-line text-lg text-white"></i>
      </div>
      <div>
        <h6 class="text-sm font-semibold leading-5">
          Activities
        </h6>
        <p class="text-2xs text-gray-500">
          Total: {{ activities.total }}
        </p>
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
          New activities
        </p>
        <app-dashboard-count
          :query="activitiesCount"
          :percentage="true"
        />
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
  activitiesCount,
  chartOptions
} from '@/modules/dashboard/dashboard.cube'
import AppDashboardConversationList from '@/modules/dashboard/components/conversations/dashboard-conversation-list'
import AppDashboardActivityList from '@/modules/dashboard/components/activity/dashboard-activity-list'
import AppDashboardActivitySentiment from '@/modules/dashboard/components/activity/dashboard-activity-sentiment'
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count'
export default {
  name: 'AppDashboardActivities',
  components: {
    AppDashboardCount,
    AppDashboardActivitySentiment,
    AppDashboardActivityList,
    AppDashboardConversationList,
    AppWidgetCubeRenderer
  },
  data() {
    return {
      tab: 'trending',
      hoveredSentiment: '',
      activitiesChart,
      activitiesCount,
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
    line-height: 220px !important;
    height: auto !important;
  }
  canvas {
    height: 220px !important;
  }
}

.chart-loading {
  @apply flex items-center justify-center;
  height: 220px;
}
</style>
