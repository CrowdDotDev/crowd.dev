<template>
  <div
    class="flex flex-wrap justify-between border-b border-gray-200"
  >
    <div class="pb-2">
      <h4 class="text-xl font-semibold leading-9">
        Overview of
        <span class="text-brand-500">{{
          currentTenant.name
        }}</span>
        community
      </h4>
      <app-dashboard-filters />
    </div>
    <div class="w-full lg:w-auto md:w-auto pb-2">
      <p
        class="text-gray-400 text-2xs leading-5 uppercase font-semibold tracking-wide md:text-right lg:text-right tracking-1 pb-1"
      >
        Active integrations
      </p>
      <app-dashboard-integrations />
    </div>
  </div>
</template>

<script>
import AppDashboardIntegrations from '@/modules/dashboard/components/dashboard-active-integrations'
import { mapGetters } from 'vuex'
import moment from 'moment'
import { activitiesChart } from '@/modules/dashboard/dashboard.cube'
import AppDashboardFilters from '@/modules/dashboard/components/dashboard-filters'
export default {
  name: 'AppDashboardHeader',
  components: {
    AppDashboardFilters,
    AppDashboardIntegrations
  },
  computed: {
    ...mapGetters('auth', {
      currentTenant: 'currentTenant'
    }),
    query() {
      return activitiesChart(1, 'all').settings.query
    }
  },
  methods: {
    lastUpdated(resultSet) {
      const format = 'YYYY-M-D HH:mm'
      if (resultSet.loadResponses.length > 0) {
        const refreshTime =
          resultSet.loadResponses[0].lastRefreshTime
        return moment(refreshTime).format(format)
      }
      return moment().format(format)
    }
  }
}
</script>
