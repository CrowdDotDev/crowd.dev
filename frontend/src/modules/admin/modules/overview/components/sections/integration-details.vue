<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
    <!-- Header -->
    <div class="border-b border-gray-200 px-5 pt-5 pb-0">
      <h3 class="text-base font-semibold text-gray-900 mb-6">
        In progress & troubleshooting
      </h3>
      
      <!-- Tabs -->
      <integration-tabs :tabs="overviewTabs" :modelValue="activeTab" @update:modelValue="activeTab = $event" />
    </div>

    <!-- Table Headers -->
    <div class="flex items-center gap-4 pt-5 pb-3 px-5 text-xs font-semibold text-gray-400">
      <div class="w-1/6">Integration</div>
      <div class="w-2/6">Project</div>
      <div class="w-3/6">Status</div>
    </div>

    <!-- Integration Rows -->
    <div class="divide-y divide-gray-200">
      <integration-row 
        v-for="integrationStatus in paginatedIntegrations" 
        :key="integrationStatus.id"
        :integrationStatus="integrationStatus"
      />
    </div>

    <!-- Footer -->
    <div class="px-5 py-6 flex items-center justify-center gap-4">
      <span class="text-xs text-gray-400">{{ paginationText }}</span>
      <button 
        v-if="hasNextPage"
        class="text-xs text-primary-500 font-semibold hover:text-primary-600 flex items-center gap-1" 
        :disabled="isFetchingNextPage"
        :class="{ 'cursor-not-allowed': isFetchingNextPage }"
        @click="() => fetchNextPage()">
        <lf-icon name="circle-notch animate-spin" :size="16" class="text-primary-200" v-if="isFetchingNextPage" />
        <span v-if="isFetchingNextPage" class="text-primary-200">Loading integrations...</span>
        <span v-else>Load more</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { mockOverviewData } from '@/modules/admin/modules/overview/store/mock-overview-data';
import IntegrationTabs from '@/modules/admin/modules/overview/components/fragments/integration-tabs.vue';
import IntegrationRow from '@/modules/admin/modules/overview/components/fragments/integration-row.vue';
import { useOverviewStore } from '@/modules/admin/modules/overview/store/overview.store';
import { storeToRefs } from 'pinia';
import { lfIntegrationStatusesTabs } from '@/modules/admin/modules/integration/config/status';
import { OVERVIEW_API_SERVICE } from '@/modules/admin/modules/overview/services/overview.api.service';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const { integrationStatusCount, selectedIntegrationId } = storeToRefs(useOverviewStore());

// Mock data for integrations
const integrations = ref(mockOverviewData);

const activeTab = ref(lfIntegrationStatusesTabs.connecting.key);
const limit = ref(3);

const params = computed(() => {
  return {
    platform: selectedIntegrationId.value || undefined, //activeTab.value,
    status: ['done'], //lfIntegrationStatusesTabs[activeTab.value].statuses,
    query: '',
    limit: limit.value
  };
});

const { data, isPending, isError, isFetchingNextPage, fetchNextPage, hasNextPage } = OVERVIEW_API_SERVICE.fetchGlobalIntegrations(params);
const totalCount = computed(() => {
  // @ts-expect-error - TanStack Query type inference issue with Vue
  return data.value?.pages[0].count || 0;
});

// TODO: remove mock data and use the API
const filteredIntegrations = computed(() => {
  return integrations.value.filter(integration => {
    switch (activeTab.value) {
      case lfIntegrationStatusesTabs.connecting.key:
        return integration.status === 'in-progress';
      case lfIntegrationStatusesTabs.waitingForAction.key:
        return integration.status === 'mapping' || integration.status === 'pending-action';
      case lfIntegrationStatusesTabs.error.key:
        return integration.status === 'error';
      default:
        return true;
    }
  });
});

const paginatedIntegrations = computed(() => {
  // @ts-expect-error - TanStack Query type inference issue with Vue
  return data.value?.pages.flatMap(page => page.rows) || [];
});

const paginationText = computed(() => {
  const showing = paginatedIntegrations.value.length;
  return `${showing} out of ${totalCount.value} integrations`;
});

const overviewTabs = computed(() => {
  return [
  {
    label: 'In progress',
    key: lfIntegrationStatusesTabs.connecting.key,
    count: integrationStatusCount.value[lfIntegrationStatusesTabs.connecting.key] || 0,
    icon: lfIntegrationStatusesTabs.connecting.chipStatus?.icon || lfIntegrationStatusesTabs.connecting.status.icon,
  },
  {
    label: 'Action required',
    key: lfIntegrationStatusesTabs.waitingForAction.key,
    count: integrationStatusCount.value[lfIntegrationStatusesTabs.waitingForAction.key] || 0,
    icon: lfIntegrationStatusesTabs.waitingForAction.chipStatus?.icon || lfIntegrationStatusesTabs.waitingForAction.status.icon,
  },
  {
    label: 'Connection failed',
    key: lfIntegrationStatusesTabs.error.key,
    count: integrationStatusCount.value[lfIntegrationStatusesTabs.error.key] || 0,
    icon: lfIntegrationStatusesTabs.error.chipStatus?.icon || lfIntegrationStatusesTabs.error.status.icon,
  },
]
});

watch(data, () => {
  // if (data.value) {
  //   integrations.value = data.value.rows;
  // }
  console.log(data.value);
}, { immediate: true });

// watch(isError, () => {
//   if (isError.value) {
//     ToastStore.error('Failed to fetch global integrations');
//   }
// });
</script>

<script lang="ts">
export default {
  name: 'AppLfOverviewIntegrationDetails',
};
</script>

