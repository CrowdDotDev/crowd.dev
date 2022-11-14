<template>
  <div class="flex flex-wrap justify-between">
    <div class="pb-2">
      <h4 class="text-xl font-semibold leading-9">
        Overview of
        <span class="text-brand-500">{{
          currentTenant.name
        }}</span>
      </h4>
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
export default {
  name: 'AppDashboardHeader',
  components: {
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
