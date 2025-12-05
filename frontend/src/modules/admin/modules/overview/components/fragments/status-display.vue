<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-1.5 mb-1">
      <lf-icon 
        :name="status.status.icon" 
        :size="16" 
        :class="statusIconClass"
      />
      <span class="text-sm font-medium text-gray-900">{{ status.status.text }}</span>
    </div>
    <div class="text-xs text-gray-500">{{ integrationStatus.statusDetails }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { IntegrationStatus } from '../../types/overview.types';
import { getIntegrationStatus } from '@/modules/admin/modules/integration/config/status';

const props = defineProps<{
  integrationStatus: IntegrationStatus;
}>();

const status = computed(() => getIntegrationStatus(props.integrationStatus));
const statusIconClass = computed(() => {
  return status.value.status.color + (status.value.key === 'in-progress' ? ' animate-spin' : '');
});
</script>