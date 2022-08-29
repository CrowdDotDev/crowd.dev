<template>
  <div class="dashboard">
    <div v-if="widgetsCount > 0">
      <app-dashboard-datetime-based-widgets />
      <app-dashboard-recent-updates-widgets />
      <el-row :gutter="16" class="mt-8 mb-2">
        <el-col :lg="12" :md="12" :sm="24">
          <div class="font-light text-xl">
            Other resources
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="16" class="flex mb-4">
        <el-col :lg="12" :md="12" :sm="24">
          <app-widget-benchmark />
        </el-col>
        <el-col :lg="12" :md="12" :sm="24">
          <app-widget-integrations />
        </el-col>
      </el-row>
    </div>
    <div
      v-else
      v-loading="loading"
      class="app-page-spinner"
    ></div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import DashboardDatetimeBasedWidgets from './dashboard-datetime-based-widgets'
import DashboardRecentUpdatesWidgets from './dashboard-recent-updates-widgets'
import WidgetBenchmark from '@/modules/widget/components/dashboard/widget-benchmark'
import WidgetIntegrations from '@/modules/widget/components/dashboard/widget-integrations'

export default {
  name: 'AppDashboardPage',
  components: {
    'app-dashboard-datetime-based-widgets': DashboardDatetimeBasedWidgets,
    'app-dashboard-recent-updates-widgets': DashboardRecentUpdatesWidgets,
    'app-widget-benchmark': WidgetBenchmark,
    'app-widget-integrations': WidgetIntegrations
  },
  computed: {
    ...mapGetters({
      widgetsArray: 'widget/array',
      widgetsCount: 'widget/count',
      widgetsLoading: 'widget/loadingFetch',
      widgetFindByType: 'widget/findByType',
      cubejsApi: 'widget/cubejsApi'
    }),
    isLocalhost() {
      return process.env.NODE_ENV === 'localhost'
    },
    loading() {
      return this.widgetsLoading
    }
  },
  async created() {
    if (!this.cubejsApi) {
      await this.getCubeToken()
    }

    await this.doFetchWidgets()
  },
  async mounted() {
    window.analytics.page('Dashboard')
  },
  methods: {
    ...mapActions({
      doFetchWidgets: 'widget/doFetch',
      getCubeToken: 'widget/getCubeToken'
    })
  }
}
</script>

<style lang="scss">
.dashboard {
  .dashboard-loader {
    @apply absolute inset-0 z-10;

    &-bg {
      @apply bg-white absolute inset-0;
      opacity: 0.9;
    }

    &-spinner {
      @apply absolute inset-0 z-10;
    }
  }
}
</style>
