<template>
  <query-renderer
    v-if="cubejsApi && query"
    :cubejs-api="cubejsApi"
    :query="query"
  >
    <template #default="{ resultSet }">
      <div
        v-if="loadingData(resultSet)"
        class="flex items-center pb-4 py-0.5"
      >
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
      <div v-else>
        <div class="flex items-center pb-4">
          <h6 class="text-base leading-5 mr-2">
            {{ total }}
          </h6>
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
import { QueryRenderer } from '@cubejs-client/vue3'
import AppDashboardBadge from '@/modules/dashboard/components/shared/dashboard-badge'
import AppLoading from '@/shared/loading/loading-placeholder'
export default {
  name: 'AppDashboardCount',
  components: {
    AppLoading,
    AppDashboardBadge,
    QueryRenderer
  },
  props: {
    query: {
      required: true,
      type: Object
    },
    total: {
      required: true,
      type: Number
    },
    loading: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters('widget', ['cubejsToken', 'cubejsApi']),
    ...mapGetters('dashboard', ['period', 'platform'])
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
    loadingData(resultSet) {
      return (
        !resultSet ||
        resultSet.loadResponse === undefined ||
        this.loading
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
      if (score > 0) {
        return 'success'
      }
      if (score < 0) {
        return 'danger'
      }
      return 'info'
    },
    computedBageLabel(resultSet) {
      const score = this.computedScore(resultSet)
      if (score > 0) {
        return `+${score}`
      }
      if (score < 0) {
        return score
      }
      return '='
    }
  }
}
</script>
