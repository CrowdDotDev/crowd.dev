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
        <p class="ml-1 text-xs leading-5">
          Last updated at {{ lastUpdated }}
        </p>
      </div>
    </div>
    <div class="w-full md:w-auto pb-2">
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
export default {
  name: 'AppDashboardHeader',
  components: {
    AppDashboardIntegrations
  },
  computed: {
    ...mapGetters('auth', {
      currentTenant: 'currentTenant'
    }),
    lastUpdated() {
      return moment(this.currentTenant.updatedAt).format(
        'hh:mm'
      )
    }
  }
}
</script>
