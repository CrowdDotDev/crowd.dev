<template>
  <div class="flex -m-5">
    <div class="flex-grow h-screen overflow-auto">
      <div class="flex justify-center">
        <div class="home-content px-8">
          <div class="py-8">
            <h4 class="text-xl leading-9 font-semibold">
              {{ currentTenant.name }} team overview
            </h4>
          </div>

          <app-dashboard-filters class="mb-8" />
          <app-dashboard-members class="mb-8"/>
          <app-dashboard-organizations class="mb-8"/>
          <app-dashboard-activities  class="mb-8"/>
        </div>
      </div>
    </div>
    <aside
      class="border-l border-gray-200 h-screen overflow-auto px-5 py-6"
    >
      <app-dashboard-integrations />
      <app-dashboard-task class="hidden" />
    </aside>
  </div>
</template>

<script setup>
import AppDashboardActivities from '@/modules/dashboard/components/dashboard-activities'
import AppDashboardMembers from '@/modules/dashboard/components/dashboard-members'
import AppDashboardOrganizations from '@/modules/dashboard/components/dashboard-organizations'
import AppDashboardTask from '@/modules/dashboard/components/dashboard-task'
import AppDashboardFilters from '@/modules/dashboard/components/dashboard-filters'
import AppDashboardIntegrations from '@/modules/dashboard/components/dashboard-active-integrations.vue'

import { onMounted } from 'vue'
import { mapGetters } from '@/shared/vuex/vuex.helpers'

const { currentTenant } = mapGetters('auth')

onMounted(() => {
  window.analytics.page('Dashboard')
})
</script>

<style lang="scss">
aside {
  width: 16.25rem;
}
.home-content {
  max-width: 60rem;
  width: 100%;
}
</style>
