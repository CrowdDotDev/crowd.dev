<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
    <!-- Header -->
    <div class="border-b border-gray-200 px-5 pt-5 pb-0">
      <h3 class="text-base font-semibold text-gray-900 mb-6">
        In progress & troubleshooting
      </h3>
      
      <!-- Tabs -->
      <integration-tabs :tabs="mockOverviewTabs" :modelValue="activeTab" @update:modelValue="activeTab = $event" />
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
        v-for="integrationStatus in filteredIntegrations" 
        :key="integrationStatus.id"
        :integrationStatus="integrationStatus"
      />
    </div>

    <!-- Footer -->
    <div class="px-5 py-6 flex items-center justify-center gap-4">
      <span class="text-xs text-gray-400">{{ paginationText }}</span>
      <button class="text-xs text-primary-500 font-semibold hover:text-primary-600">
        Load more
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { mockOverviewData } from '@/modules/admin/modules/overview/store/mock-overview-data';
import IntegrationTabs from '@/modules/admin/modules/overview/components/fragments/integration-tabs.vue';
import { mockOverviewTabs } from '@/modules/admin/modules/overview/store/mock-overview-data';
import IntegrationRow from '@/modules/admin/modules/overview/components/fragments/integration-row.vue';

// Mock data for integrations
const integrations = ref(mockOverviewData);

const activeTab = ref('in-progress');

const filteredIntegrations = computed(() => {
  return integrations.value.filter(integration => {
    switch (activeTab.value) {
      case 'in-progress':
        return integration.status === 'in-progress';
      case 'action-required':
        return integration.status === 'mapping' || integration.status === 'pending-action';
      case 'connection-failed':
        return integration.status === 'error';
      default:
        return true;
    }
  });
});

const paginationText = computed(() => {
  const total = 120;
  const showing = filteredIntegrations.value.length;
  return `${showing} out of ${total} integrations`;
});
</script>

<script lang="ts">
export default {
  name: 'AppLfOverviewIntegrationDetails',
};
</script>

