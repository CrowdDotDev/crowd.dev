<template>
  <div
    class="flex flex-wrap justify-between border-b border-gray-200 pb-6"
  >
    <div class="pb-2">
      <h4 class="text-xl font-semibold leading-9 mb-1">
        Overview of
        <span class="text-brand-500">{{
          currentTenant.name
        }}</span>
        community
      </h4>
      <div class="flex items-center text-gray-500">
        <i class="ri-information-line text-base"></i>
        <app-cube-render :query="query">
          <template #loading>
            <app-loading
              class="ml-1"
              height="13px"
              width="140px"
            ></app-loading>
          </template>
          <template #default="{ resultSet }">
            <p class="ml-1 text-xs leading-5">
              Last updated at {{ lastUpdated(resultSet) }}
            </p>
          </template>
        </app-cube-render>
      </div>
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
import AppCubeRender from '@/shared/cube/cube-render'
import { activitiesChart } from '@/modules/dashboard/dashboard.cube'
import AppLoading from '@/shared/loading/loading-placeholder'
export default {
  name: 'AppDashboardHeader',
  components: {
    AppLoading,
    AppCubeRender,
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
      const format = 'YYYY-M-D hh:mm'
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
