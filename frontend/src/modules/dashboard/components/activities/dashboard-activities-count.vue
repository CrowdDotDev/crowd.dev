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
            4,600 activities
          </p>
          <app-dashboard-badge>+2%</app-dashboard-badge>
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
    loading(resultSet) {
      return (
        !resultSet || resultSet.loadResponse === undefined
      )
    }
  }
}
</script>
