<template>
  <app-cube-render :query="query" :loading="loading">
    <template #loading>
      <div class="flex items-center pb-4 py-0.5">
        <app-loading
          width="23px"
          height="16px"
          radius="4px"
          class="mr-2"
        ></app-loading>
        <app-loading
          width="22px"
          height="16px"
          radius="4px"
        ></app-loading>
      </div>
    </template>

    <template #default="{ resultSet }">
      <div class="flex items-center pb-4">
        <h6 class="text-base leading-5 mr-2">
          {{ computedScore(resultSet).current }}
        </h6>
        <el-tooltip
          :content="`Difference from previous ${period} days`"
          placement="right"
        >
          <app-dashboard-badge
            :type="computedBadgeType(resultSet)"
            >{{
              computedBageLabel(resultSet)
            }}</app-dashboard-badge
          >
        </el-tooltip>
      </div>
    </template>
  </app-cube-render>
</template>

<script>
import { mapGetters } from 'vuex'
import AppDashboardBadge from '@/modules/dashboard/components/shared/dashboard-badge'
import AppLoading from '@/shared/loading/loading-placeholder'
import AppCubeRender from '@/shared/cube/cube-render'
export default {
  name: 'AppDashboardCount',
  components: {
    AppCubeRender,
    AppLoading,
    AppDashboardBadge
  },
  props: {
    query: {
      required: true,
      type: Object
    },
    loading: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters('dashboard', ['period', 'platform'])
  },
  methods: {
    computedScore(resultSet) {
      const seriesNames = resultSet.seriesNames()
      const pivot = resultSet.chartPivot()
      let periodBeforeCount = 0
      let periodCount = 0
      seriesNames.forEach((e) => {
        const data = pivot.map((p) => p[e.key])
        periodBeforeCount += data
          .slice(0, this.period)
          .reduce((a, b) => a + b, 0)
        periodCount += data
          .slice(-this.period)
          .reduce((a, b) => a + b, 0)
      })
      return {
        before: periodBeforeCount,
        current: periodCount
      }
    },
    computedBadgeType(resultSet) {
      const score = this.computedScore(resultSet)
      const diff = score.current - score.before
      if (diff > 0) {
        return 'success'
      }
      if (diff < 0) {
        return 'danger'
      }
      return 'info'
    },
    computedBageLabel(resultSet) {
      const score = this.computedScore(resultSet)
      const diff = score.current - score.before
      if (diff > 0) {
        return `+${diff}`
      }
      if (diff < 0) {
        return diff
      }
      return '='
    }
  }
}
</script>
