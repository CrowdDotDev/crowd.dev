<template>
  <div v-if="currentTenant" class="flex -m-5">
    <div
      class="flex-grow overflow-auto"
      :style="{
        height: showBanner
          ? 'calc(100vh - 3.5rem)'
          : '100vh',
      }"
      @scroll="handleScroll($event)"
    >
      <div class="flex justify-center">
        <div class="home-content px-8">
          <div
            class="py-8 -mx-4 px-4 sticky -top-6 bg-gray-50 z-20 flex items-center justify-between"
          >
            <h4
              class="leading-8 font-semibold transition-all duration-100"
              :class="scrolled ? 'text-base' : 'text-xl'"
            >
              {{ currentTenant?.name }} team overview
            </h4>
            <div class=" text-sm flex items-center gap-2">
              <i class="text-gray-400 ri-time-line text-base" />
              <span class="text-gray-400">Data on this page refreshed every hour</span>
            </div>
          </div>

          <div
            class="mb-8 -mx-4 px-4 sticky top-12 bg-gray-50 z-20"
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
      class="border-l border-gray-200 overflow-auto px-5 py-6"
      :style="{
        height: showBanner
          ? 'calc(100vh - 3.5rem)'
          : '100vh',
      }"
    >
      <app-dashboard-guides />
      <app-dashboard-integrations class="mb-10" />
      <app-dashboard-task />
    </aside>
  </div>
</template>

<script setup>
import {
  onMounted, onBeforeUnmount, ref, computed, watch,
} from 'vue';
import { useStore } from 'vuex';
import AppDashboardIntegrations from '@/modules/dashboard/components/dashboard-active-integrations.vue';
import {
  mapGetters,
  mapActions,
} from '@/shared/vuex/vuex.helpers';
import AppDashboardGuides from '@/modules/dashboard/components/dashboard-guides.vue';
import AppDashboardActivities from '@/modules/dashboard/components/dashboard-activities.vue';
import AppDashboardMembers from '@/modules/dashboard/components/dashboard-members.vue';
import AppDashboardOrganizations from '@/modules/dashboard/components/dashboard-organizations.vue';
import AppDashboardTask from '@/modules/dashboard/components/dashboard-task.vue';
import AppDashboardFilters from '@/modules/dashboard/components/dashboard-filters.vue';

const { currentTenant } = mapGetters('auth');
const { showBanner } = mapGetters('tenant');
const { cubejsApi } = mapGetters('widget');
const { doFetch } = mapActions('report');
const { reset } = mapActions('dashboard');
const { getCubeToken } = mapActions('widget');

const store = useStore();

const storeUnsubscribe = ref(null);
const scrolled = ref(false);

const loadingCubeToken = computed(() => !!cubejsApi.value);

const handleScroll = (event) => {
  scrolled.value = event.target.scrollTop > 20;
};

onMounted(() => {
  window.analytics.page('Dashboard');

  if (!cubejsApi.value) {
    getCubeToken();
  }

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

watch(currentTenant, (updatedTenant, previousTenant) => {
  if (updatedTenant.id !== previousTenant.id) {
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
