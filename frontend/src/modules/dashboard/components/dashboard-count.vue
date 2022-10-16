<template>
  <query-renderer
    v-if="cubejsApi && query"
    :cubejs-api="cubejsApi"
    :query="query"
  >
    <template #default="{ resultSet }">
      <div
        v-if="loading(resultSet)"
        v-loading="loading(resultSet)"
        class="app-page-spinner h-16 !relative !min-h-5"
      ></div>
      <div v-else>
        <div class="flex items-center pb-4">
          <h6 class="text-base leading-5 mr-2">52</h6>
          <app-dashboard-badge type="success"
            >+12</app-dashboard-badge
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
export default {
  name: 'AppDashboardCount',
  components: {
    AppDashboardBadge,
    QueryRenderer
  },
  props: {
    query: {
      required: true,
      type: Object
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
