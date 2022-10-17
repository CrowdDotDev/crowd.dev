<template>
  <query-renderer
    v-if="cubejsApi"
    :cubejs-api="cubejsApi"
    :query="
      activitiesChart(period, platform).settings.query
    "
  >
    <template #default="{ resultSet }">
      <div
        v-if="loading(resultSet)"
        v-loading="loading(resultSet)"
        class="app-page-spinner h-16 !relative !min-h-5"
      ></div>
      <div v-else>
        <div class="flex items-center pb-6">
          <p class="text-sm font-medium mr-2">
            {{ activities.total }} activities
          </p>
          <app-dashboard-badge
            :type="computedBadgeType(resultSet)"
            >{{
              computedBageLabel(resultSet)
            }}</app-dashboard-badge
          >
        </div>
      </div>
    </template>
  </query-renderer>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { activitiesChart } from '@/modules/dashboard/dashboard.cube'
import { QueryRenderer } from '@cubejs-client/vue3'
import AppDashboardBadge from '@/modules/dashboard/components/shared/dashboard-badge'
export default {
  name: 'AppDashboardActivitiesCount',
  components: {
    AppDashboardBadge,
    QueryRenderer
  },
  data() {
    return {
      activitiesChart
    }
  },
  computed: {
    ...mapGetters('widget', ['cubejsToken', 'cubejsApi']),
    ...mapGetters('dashboard', [
      'period',
      'platform',
      'activities'
    ])
  },
  async created() {
    if (this.cubejsApi === null) {
      await this.getCubeToken()
    }
  },
  methods: {
    ...mapActions({
      getCubeToken: 'widget/getCubeToken'
    }),
    loading(resultSet) {
      return (
        !resultSet || resultSet.loadResponse === undefined
      )
    },
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
    computedBageLabel(resultSet) {
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
    }
  }
}
</script>
