<template>
  <div v-if="currentTenant" class="flex -m-5">
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
                'leading-8 font-semibold transition-all duration-100 uppercase font-header': true,
                'text-xl': !scrolled,
                'text-base': scrolled,
              }"
            />
            <div class=" text-sm flex items-center gap-2">
              <i class="text-gray-500 ri-time-line text-base" />
              <span class="text-gray-500">Data on this page is refreshed every 15 min.</span>
            </div>
          </div>

          <div
            class="mb-8 -mx-4 px-4 sticky top-12 bg-white z-20"
          >
            <app-dashboard-filters class="block" />
          </div>

          <div
            v-if="!loadingCubeToken"
            v-loading="!loadingCubeToken"
            class="app-page-spinner h-16 !relative !min-h-5"
          />
          <div v-else>
            <app-dashboard-members class="mb-8" />
            <app-dashboard-organizations class="mb-8" />
            <app-dashboard-activities class="mb-8" />
          </div>
        </div>
      </div>
    </div>
    <aside
      v-if="selectedProjectGroup"
      class="border-l border-gray-200 overflow-auto px-5 py-6 h-screen"
    >
      <app-dashboard-project-group />
    </aside>
  </div>
</template>

<script setup>
import {
  onMounted, onBeforeUnmount, ref, watch, computed,
} from 'vue';
import { useStore } from 'vuex';
import {
  mapGetters,
  mapActions,
} from '@/shared/vuex/vuex.helpers';
import AppDashboardActivities from '@/modules/dashboard/components/dashboard-activities.vue';
import AppDashboardMembers from '@/modules/dashboard/components/dashboard-members.vue';
import AppDashboardOrganizations from '@/modules/dashboard/components/dashboard-organizations.vue';
import AppDashboardFilters from '@/modules/dashboard/components/dashboard-filters.vue';
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import AppDashboardProjectGroup from '@/modules/dashboard/components/dashboard-project-group.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const { currentTenant } = mapGetters('auth');
const { cubejsApi } = mapGetters('widget');
const { doFetch } = mapActions('report');
const { reset } = mapActions('dashboard');
const { getCubeToken } = mapActions('widget');

const store = useStore();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const storeUnsubscribe = ref(null);
const scrolled = ref(false);

const loadingCubeToken = computed(() => !!cubejsApi.value);

const handleScroll = (event) => {
  scrolled.value = event.target.scrollTop > 20;
};

onMounted(() => {
  window.analytics.page('Dashboard');

  if (currentTenant.value) {
    doFetch({});
  }

  storeUnsubscribe.value = store.subscribeAction(
    (action) => {
      if (action.type === 'auth/doSelectTenant') {
        doFetch({});
        reset({});
      }
    },
  );
});

onBeforeUnmount(() => {
  storeUnsubscribe.value();
});

watch(selectedProjectGroup, (updatedProjectGroup, previousProjectGroup) => {
  if (updatedProjectGroup?.id !== previousProjectGroup?.id) {
    getCubeToken();
  }
}, {
  deep: true,
  immediate: true,
});
</script>

<style lang="scss" scoped>
aside {
  width: 16.25rem;
  min-width: 16.25rem;
}
.home-content {
  max-width: 60rem;
  width: 100%;
}
</style>
