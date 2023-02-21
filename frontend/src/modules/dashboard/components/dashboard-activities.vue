<template>
  <div class="widget panel !p-6">
    <!-- header -->
    <div
      class="flex items-center justify-between pb-5 border-b border-gray-200"
    >
      <div class="flex items-center">
        <h5 class="text-lg font-semibold leading-7 pr-3">
          Activities
        </h5>
        <app-loading
          v-if="activities.loading"
          height="20px"
          width="60px"
        />
        <p v-else class="text-xs text-gray-500 leading-5">
          Total:
          {{ formatNumberToCompact(activities.total) }}
        </p>
      </div>
      <div class="flex items-center">
        <router-link
          :to="{
            name: 'activity'
          }"
        >
          <el-button
            class="btn btn-brand--transparent btn--sm w-full leading-5 text-brand-500"
          >
            All activities
          </el-button>
        </router-link>
        <router-link
          v-if="activitiesReportId"
          :to="{
            name: 'reportTemplate',
            params: {
              id: activitiesReportId
            }
          }"
          class="ml-4"
        >
          <el-button
            class="custom-btn flex items-center text-gray-600 !px-3"
          >
            <i
              class="ri-bar-chart-line text-base text-gray-600 mr-2"
            ></i>
            <span class="text-xs">View report</span>
          </el-button>
        </router-link>
      </div>
    </div>

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
              :loading="activities.loading"
              :query="activitiesCount"
            ></app-dashboard-count>
          </div>
          <div class="w-7/12">
            <div
              v-if="activities.loading"
              v-loading="activities.loading"
              class="app-page-spinner h-16 !relative !min-h-5 chart-loading"
            ></div>
            <app-cube-render
              v-else
              :query="activitiesChart(period, platform)"
            >
              <template #default="{ resultSet }">
                <app-widget-area
                  class="chart"
                  :datasets="datasets"
                  :result-set="resultSet"
                  :chart-options="chartStyle"
                  :granularity="granularity.value"
                />
              </template>
            </app-cube-render>
          </div>
        </div>
        <div class="pt-10">
          <h6 class="text-sm leading-5 font-semibold mb-4">
            Overall sentiment
          </h6>
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
import {
  activitiesChart,
  activitiesCount,
  dashboardChartOptions
} from '@/modules/dashboard/dashboard.cube'
import AppDashboardConversationList from '@/modules/dashboard/components/conversations/dashboard-conversation-list'
import AppDashboardActivityList from '@/modules/dashboard/components/activity/dashboard-activity-list'
import AppDashboardActivitySentiment from '@/modules/dashboard/components/activity/dashboard-activity-sentiment'
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count'
import { formatNumberToCompact } from '@/utils/number'
import AppDashboardActivityTypes from '@/modules/dashboard/components/activity/dashboard-activity-types.vue'
import { chartOptions } from '@/modules/report/templates/template-report-charts'
import { DAILY_GRANULARITY_FILTER } from '@/modules/widget/widget-constants'
import AppCubeRender from '@/shared/cube/cube-render.vue'
import AppWidgetArea from '@/modules/widget/components/v2/shared/widget-area.vue'
import AppLoading from '@/shared/loading/loading-placeholder.vue'

export default {
  name: 'AppDashboardActivities',
  components: {
    AppLoading,
    AppWidgetArea,
    AppCubeRender,
    AppDashboardActivityTypes,
    AppDashboardCount,
    AppDashboardActivitySentiment,
    AppDashboardActivityList,
    AppDashboardConversationList
  },
  data() {
    return {
      tab: 'trending',
      hoveredSentiment: '',
      activitiesChart,
      activitiesCount,
      dashboardChartOptions,
      granularity: DAILY_GRANULARITY_FILTER
    }
  },
  computed: {
    ...mapGetters('dashboard', [
      'period',
      'platform',
      'activities'
    ]),
    ...mapGetters('report', ['rows']),
    activitiesReportId() {
      const report = this.rows.find(
        (r) =>
          r.isTemplate && r.name === 'Activities report'
      )
      if (!report) {
        return null
      }
      return report.id
    },
    datasets() {
      return [
        {
          name: 'new activities',
          borderColor: '#E94F2E',
          measure: 'Activities.count',
          granularity: this.granularity.value
        }
      ]
    },
    chartStyle() {
      return chartOptions('area', dashboardChartOptions)
    }
  },
  methods: {
    formatNumberToCompact
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
    line-height: 112px !important;
    height: auto !important;
  }
  .cube-widget-chart {
    padding: 0;
    min-height: 0;
  }
  canvas {
    height: 112px;
  }
}

.chart-loading {
  @apply flex items-center justify-center;
  height: 112px;
}
.app-page-spinner {
  min-height: initial;
}
</style>
