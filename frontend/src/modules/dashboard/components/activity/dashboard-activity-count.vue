<template>
  <app-cube-render
    :query="
      activitiesChart(period, platform).settings.query
    "
  >
    <template #loading>
      <div class="flex items-center pb-6">
        <app-loading
          height="16px"
          width="120px"
        ></app-loading>
      </div>
    </template>
    <template #default="{ resultSet }">
      <div class="flex items-center pb-6">
        <p class="text-sm font-medium mr-2">
          {{ computedScore(resultSet) }}
        </p>
        <el-tooltip
          content="vs. previous same period"
          placement="top"
        >
          <app-dashboard-badge
            :type="computedBadgeType(resultSet)"
            >{{
              computedBadgeLabel(resultSet)
            }}</app-dashboard-badge
          >
        </el-tooltip>
      </div>
    </template>
  </app-cube-render>
</template>

<script>
import { mapGetters } from 'vuex'
import { activitiesChart } from '@/modules/dashboard/dashboard.cube'
import AppDashboardBadge from '@/modules/dashboard/components/shared/dashboard-badge'
import AppCubeRender from '@/shared/cube/cube-render'
import AppLoading from '@/shared/loading/loading-placeholder'
export default {
  name: 'AppDashboardActivityCount',
  components: {
    AppLoading,
    AppCubeRender,
    AppDashboardBadge
  },
  data() {
    return {
      activitiesChart
    }
  },
  computed: {
    ...mapGetters('dashboard', [
      'period',
      'platform',
      'activities'
    ])
  },
  methods: {
    computedScore(resultSet) {
      const seriesNames = resultSet.seriesNames()
      const pivot = resultSet.chartPivot()
      let count = 0
      seriesNames.forEach((e) => {
        const data = pivot.map((p) => p[e.key])
        count = data.reduce((a, b) => a + b, 0)
      })
      return count
    },
    computedBadgeType(resultSet) {
      const score = this.computedScore(resultSet)
      if (this.activities.total > 0) {
        if (score > 0) {
          return 'success'
        }
        if (score < 0) {
          return 'danger'
        }
      }
      return 'info'
    },
    computedBadgeLabel(resultSet) {
      const score = this.computedScore(resultSet)
      if (this.activities.total > 0) {
        if (score > 0) {
          return `+${Math.round(
            (score / this.activities.total) * 100
          )}%`
        }
        if (score < 0) {
          return `${Math.round(
            (score / this.activities.total) * 100
          )}%`
        }
      }

      return '='
    },
    numberWithCommas(x) {
      return x
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
  }
}
</script>
