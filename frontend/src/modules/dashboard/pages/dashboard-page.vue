<template>
  <page-wrapper>
    <div class="flex justify-between">
      <div>
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
      <div>
        <p
          class="text-gray-400 text-2xs leading-5 uppercase font-semibold tracking-wide tracking-1 pb-1"
        >
          Active integrations
        </p>
        <app-dashboard-integrations />
      </div>
    </div>
    <div class="pt-8 flex -mx-3">
      <div class="w-full md:w-2/3 lg:w-3/4 px-3">
        <app-dashboard-activities class="mb-6" />
      </div>
      <div class="w-full md:w-1/3 lg:w-1/4 px-3">
        <app-dashboard-members class="mb-6" />
        <app-dashboard-organizations class="mb-6" />
      </div>
    </div>
  </page-wrapper>
</template>

<script>
import PageWrapper from '@/modules/layout/components/page-wrapper'
import AppDashboardIntegrations from '@/modules/dashboard/components/dashboard-active-integrations'
import { mapGetters } from 'vuex'
import moment from 'moment'
import AppDashboardActivities from '@/modules/dashboard/components/dashboard-activities'
import AppDashboardMembers from '@/modules/dashboard/components/dashboard-members'
import AppDashboardOrganizations from '@/modules/dashboard/components/dashboard-organizations'

export default {
  name: 'AppDashboardPage',
  components: {
    AppDashboardOrganizations,
    AppDashboardMembers,
    AppDashboardActivities,
    AppDashboardIntegrations,
    PageWrapper
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
