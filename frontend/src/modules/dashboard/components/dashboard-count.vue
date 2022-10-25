<template>
  <app-cube-render
    :query="query(dateRange, platform)"
    :loading="loading"
  >
    <template #loading>
      <div class="flex items-center pb-4 py-0.5">
        <app-loading
          width="80px"
          height="16px"
        ></app-loading>
      </div>
    </template>

    <template #default="current">
      <app-cube-render
        :query="query(previousDateRange, platform)"
      >
        <template #loading>
          <div class="flex items-center pb-4 py-0.5">
            <app-loading
              width="80px"
              height="16px"
            ></app-loading>
          </div>
        </template>
        <template #default="previous">
          <div class="flex items-center pb-4">
            <h6 class="text-base leading-5 mr-2">
              {{ computedScore(current.resultSet) }}
            </h6>
            <el-tooltip
              content="vs. previous same period"
              placement="top"
            >
              <app-dashboard-badge
                :type="
                  computedBadgeType(
                    current.resultSet,
                    previous.resultSet
                  )
                "
                >{{
                  computedBadgeLabel(
                    current.resultSet,
                    previous.resultSet
                  )
                }}</app-dashboard-badge
              >
            </el-tooltip>
          </div>
        </template>
      </app-cube-render>
    </template>
  </app-cube-render>
</template>

<script>
import { mapGetters } from 'vuex'
import AppDashboardBadge from '@/modules/dashboard/components/shared/dashboard-badge'
import AppLoading from '@/shared/loading/loading-placeholder'
import AppCubeRender from '@/shared/cube/cube-render'
import moment from 'moment'
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
      type: Function
    },
    loading: {
      required: false,
      type: Boolean,
      default: false
    },
    percentage: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
    ...mapGetters('dashboard', ['period', 'platform']),
    dateRange() {
      return [
        moment()
          .startOf('day')
          .subtract(this.period, 'day')
          .toISOString(),
        moment()
      ]
    },
    previousDateRange() {
      return [
        moment()
          .startOf('day')
          .subtract(this.period * 2, 'day')
          .toISOString(),
        moment()
          .startOf('day')
          .subtract(this.period, 'day')
          .toISOString()
      ]
    }
  },
  methods: {
    computedScore(resultSet) {
      const seriesNames = resultSet.seriesNames()
      const pivot = resultSet.chartPivot()
      let count = 0
      seriesNames.forEach((e) => {
        const data = pivot.map((p) => p[e.key])
        count += data.reduce((a, b) => a + b, 0)
      })
      return count
    },
    computedBadgeType(current, previous) {
      const currentScore = this.computedScore(current)
      const previousScore = this.computedScore(previous)
      const diff = currentScore - previousScore
      if (diff > 0) {
        return 'success'
      }
      if (diff < 0) {
        return 'danger'
      }
      return 'info'
    },
    computedBadgeLabel(current, previous) {
      const currentScore = this.computedScore(current)
      const previousScore = this.computedScore(previous)
      const diff = currentScore - previousScore
      if (this.percentage) {
        if (previousScore === 0) {
          if (currentScore === 0) {
            return '='
          }
          return `+100%`
        }
        if (diff > 0) {
          return `+${Math.round(
            (diff / previousScore) * 100
          )}%`
        }
        if (diff < 0) {
          return `${Math.round(
            (diff / previousScore) * 100
          )}%`
        }
      } else {
        if (diff > 0) {
          return `+${diff}`
        }
        if (diff < 0) {
          return diff
        }
      }

      return '='
    }
  }
}
</script>
