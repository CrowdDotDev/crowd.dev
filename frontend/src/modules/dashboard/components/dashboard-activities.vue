<template>
  <div class="widget panel !p-6">
    <!-- header -->
    <app-dashboard-widget-header
      title="Activities"
      :total-loading="activities.loading"
      :total="activities.total"
      :route="{ name: 'activity', hash: '#activity' }"
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
              :loading="activities.loading"
              :query="activitiesCount"
            />
          </div>
          <div class="w-7/12">
            <div
              v-if="activities.loading"
              v-loading="activities.loading"
              class="app-page-spinner h-16 !relative !min-h-5 chart-loading"
            />

            <app-dashboard-widget-chart
              v-else
              :datasets="datasets"
              :query="activitiesChart"
            />
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

    <div class="dashboard-tabs">
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
import { mapGetters } from 'vuex';
import {
  activitiesChart,
  activitiesCount,
} from '@/modules/dashboard/dashboard.cube';
import AppDashboardActivityTypes from '@/modules/dashboard/components/activity/dashboard-activity-types.vue';
import { DAILY_GRANULARITY_FILTER } from '@/modules/widget/widget-constants';
import AppDashboardWidgetHeader from '@/modules/dashboard/components/dashboard-widget-header.vue';
import AppDashboardWidgetChart from '@/modules/dashboard/components/dashboard-widget-chart.vue';
import AppDashboardConversationList from '@/modules/dashboard/components/conversations/dashboard-conversation-list.vue';
import AppDashboardActivityList from '@/modules/dashboard/components/activity/dashboard-activity-list.vue';
import AppDashboardActivitySentiment from '@/modules/dashboard/components/activity/dashboard-activity-sentiment.vue';
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue';

export default {
  name: 'AppDashboardActivities',
  components: {
    AppDashboardWidgetChart,
    AppDashboardWidgetHeader,
    AppDashboardActivityTypes,
    AppDashboardCount,
    AppDashboardActivitySentiment,
    AppDashboardActivityList,
    AppDashboardConversationList,
  },
  data() {
    return {
      tab: 'trending',
      activitiesChart,
      activitiesCount,
    };
  },
  computed: {
    ...mapGetters('dashboard', ['activities']),
    datasets() {
      return [
        {
          name: 'new activities',
          borderColor: '#E94F2E',
          measure: 'Activities.count',
          granularity: DAILY_GRANULARITY_FILTER.value,
        },
      ];
    },
  },
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
