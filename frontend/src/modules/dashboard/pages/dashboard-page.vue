<template>
  <div class="gap-x-4 px-6 lg:container lg:px-10">
    <div>
      <app-dashboard-header />
      <app-dashboard-filters />
      <div class="flex flex-wrap -mx-3">
        <div class="w-full md:w-2/3 lg:w-3/4 px-3">
          <app-dashboard-activities class="mb-6" />
        </div>
        <div class="w-full md:w-1/3 lg:w-1/4 px-3">
          <app-dashboard-members class="mb-6" />
          <app-dashboard-organizations class="mb-6" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import AppDashboardActivities from '@/modules/dashboard/components/dashboard-activities'
import AppDashboardMembers from '@/modules/dashboard/components/dashboard-members'
import AppDashboardOrganizations from '@/modules/dashboard/components/dashboard-organizations'
import AppDashboardHeader from '@/modules/dashboard/components/dashboard-header'
import AppDashboardFilters from '@/modules/dashboard/components/dashboard-filters'

export default {
  name: 'AppDashboardPage',
  components: {
    AppDashboardFilters,
    AppDashboardHeader,
    AppDashboardOrganizations,
    AppDashboardMembers,
    AppDashboardActivities
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
  },
  async mounted() {
    window.analytics.page('Dashboard')
  }
}
</script>
