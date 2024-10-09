<template>
  <div class="flex -m-5">
    <div
      class="flex-grow overflow-auto h-screen"
      @scroll="handleScroll($event)"
    >
      <div class="flex justify-center">
        <div class="home-content px-8">
          <div
            class="py-8 -mx-4 px-4 sticky -top-6 bg-white z-20 flex items-center justify-between"
          >
            <app-lf-page-header
              :text-class="{
                'leading-8 font-semibold transition-all duration-100 uppercase font-secondary': true,
                'text-xl': !scrolled,
                'text-base': scrolled,
              }"
            />
            <div class=" text-sm flex items-center gap-2">
              <lf-icon name="circle-info" :size="16" class="text-gray-500" />
              <span class="text-gray-500">Data on this page is refreshed every 15 min.</span>
            </div>
          </div>

          <div
            class="mb-8 -mx-4 px-4 sticky top-12 bg-white z-20"
          >
            <app-dashboard-filters class="block" />
          </div>

          <div>
            <app-dashboard-members class="mb-8" />
            <app-dashboard-organizations class="mb-8" />
            <app-dashboard-activities class="mb-8" />
          </div>
        </div>
      </div>
      <div class="mt-auto mb-6 flex justify-center">
        <lfx-footer class="px-2 max-w-3xl" />
      </div>
    </div>
    <aside
      v-if="selectedProjectGroup"
      class="border-l border-gray-200 overflow-auto px-5 py-6 h-screen min-w-[15rem] max-w-[20rem]"
    >
      <lf-dashboard-integrations class="mb-8" />
      <app-dashboard-project-group />
    </aside>
  </div>
</template>

<script setup>
import {
  onMounted, onUnmounted, ref,
} from 'vue';
import AppDashboardActivities from '@/modules/dashboard/components/dashboard-activities.vue';
import AppDashboardMembers from '@/modules/dashboard/components/dashboard-members.vue';
import AppDashboardOrganizations from '@/modules/dashboard/components/dashboard-organizations.vue';
import AppDashboardFilters from '@/modules/dashboard/components/dashboard-filters.vue';
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import AppDashboardProjectGroup from '@/modules/dashboard/components/dashboard-project-group.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import LfDashboardIntegrations from '@/modules/dashboard/components/dashboard-integrations.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { useFooterStore } from '@/modules/layout/pinia';

const footerStore = useFooterStore();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const scrolled = ref(false);

const handleScroll = (event) => {
  scrolled.value = event.target.scrollTop > 20;
};

onMounted(() => {
  window.analytics.page('Dashboard');
  // Hide the main footer when this page is mounted we need to show it again but with in custom way
  footerStore.setVisibility(false);
});

onUnmounted(() => {
  // Show the main footer when this page is unmounted
  footerStore.setVisibility(true);
});
</script>

<style lang="scss" scoped>
.home-content {
  max-width: 60rem;
  width: 100%;
}
</style>
