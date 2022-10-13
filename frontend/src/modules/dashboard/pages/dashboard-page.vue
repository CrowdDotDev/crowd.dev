<template>
  <page-wrapper>
    <div class="flex justify-between">
      <div>
        <h4 class="text-xl font-semibold leading-9 mb-1">
          Overview of
          <span class="text-brand-500">Crowd.dev</span>
          community
        </h4>
        <div class="flex items-center text-gray-500">
          <i class="ri-information-line text-base"></i>
          <p class="ml-1 text-xs leading-5">
            Last updated at 12:45
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
      <div class="w-full md:w-3/4 px-3">
        <!-- TODO: separate component for widget -->
        <div class="widget panel"></div>
      </div>
      <div class="w-full md:w-1/4 px-3">
        <div class="widget panel"></div>
      </div>
    </div>
  </page-wrapper>
</template>

<script>
import PageWrapper from '@/modules/layout/components/page-wrapper'
import AppDashboardIntegrations from '@/modules/dashboard/components/dashboard-active-integrations'

export default {
  name: 'AppDashboardPage',
  components: {
    AppDashboardIntegrations,
    PageWrapper
  },
  async mounted() {
    window.analytics.page('Dashboard')
  }
}
</script>
