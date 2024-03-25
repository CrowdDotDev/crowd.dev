<template>
  <span v-if="isDone" class="badge badge--green">Connected</span>
  <div v-else-if="isError" class="text-red-500 flex items-center text-sm">
    <i class="ri-error-warning-line mr-1" /> Failed to connect
  </div>
  <div v-else-if="isNoData" class="text-red-500 flex items-center text-sm">
    <i class="ri-error-warning-line mr-1" /> Not receiving activities
  </div>
  <div
    v-else-if="isWaitingForAction"
    class="text-yellow-600 flex items-center text-sm"
  >
    <i class="ri-alert-line mr-1" /> Action required
  </div>
  <div
    v-else-if="isWaitingApproval"
    class="text-gray-500 flex items-center text-sm"
  >
    <i class="ri-time-line mr-1" /> Waiting for approval
  </div>
  <div
    v-else-if="isNeedsToBeReconnected"
    class="text-yellow-600 flex items-center text-sm"
  >
    <i class="ri-alert-line mr-1" /> Needs to be reconnected
  </div>
  <div v-else-if="isConnected" class="flex items-center">
    <cr-spinner size="1rem" class="mr-2 text-black" />
    <span class="text-xs font-medium text-gray-600">Connecting</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { isCurrentDateAfterGivenWorkingDays } from '@/utils/date';
import { ERROR_BANNER_WORKING_DAYS_DISPLAY } from '@/modules/integration/integration-store';
import CrSpinner from '@/ui-kit/spinner/Spinner.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isConnected = computed(() => props.integration.status !== undefined);

const isDone = computed(
  () => props.integration.status === 'done'
    || (props.integration.status === 'error'
      && !isCurrentDateAfterGivenWorkingDays(props.integration.updatedAt, ERROR_BANNER_WORKING_DAYS_DISPLAY)),
);

const isError = computed(
  () => props.integration.status === 'error'
    && isCurrentDateAfterGivenWorkingDays(props.integration.updatedAt, ERROR_BANNER_WORKING_DAYS_DISPLAY),
);

const isNoData = computed(() => props.integration.status === 'no-data');

const isWaitingForAction = computed(
  () => ['pending-action', 'mapping'].includes(props.integration.status),
);

const isWaitingApproval = computed(
  () => props.integration.status === 'waiting-approval',
);

const isNeedsToBeReconnected = computed(
  () => props.integration.status === 'needs-reconnect',
);
</script>

<script>
export default {
  name: 'AppIntegrationStatus',
};
</script>

<style lang="scss">
</style>
