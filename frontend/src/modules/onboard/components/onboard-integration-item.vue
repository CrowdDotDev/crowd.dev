<template>
  <div
    :class="{
      'border-b border-gray-100 p-6': !integration.onboard?.highlight,
    }"
  >
    <div class="flex gap-16">
      <div class="flex gap-3 items-start flex-grow">
        <img :alt="integration.name" :src="integration.image" class="h-5" />
        <div class="flex flex-col gap-1">
          <span class="text-black text-sm font-semibold">{{ integration.name }}</span>
          <span class="text-gray-500 text-xs">{{ integration.onboard?.description }}</span>
        </div>
      </div>

      <div class="flex justify-end items-start gap-4">
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
        <div v-else-if="isConnected">
          <el-button disabled class="btn btn-brand--secondary !opacity-50">
            <i class="ri-loader-4-line animate-spin w-4 text-brand-600" />
            <span class="text-brand-600">In progress...</span>
          </el-button>
        </div>

        <app-integration-connect
          :integration="integration"
          @invite-colleagues="emit('inviteColleagues')"
        >
          <template
            #default="{
              connect,
              connected,
              settings,
              hasSettings,
              hasIntegration,
            }"
          >
            <div v-if="!connected || !isConnected || hasSettings " class="flex items-center justify-between gap-4">
              <el-button
                v-if="!connected"
                class="btn btn-brand--secondary"
                @click="() => onConnect(connect)"
              >
                {{
                  (integration.premium || integration.scale) && !hasIntegration
                    ? "Upgrade Plan"
                    : "Connect"
                }}
              </el-button>
              <el-button
                v-else-if="!isConnected"
                class="btn btn-brand btn-brand--bordered"
                :loading="loadingDisconnect"
                @click="handleDisconnect"
              >
                Disconnect
              </el-button>
              <el-button
                v-if="hasSettings"
                class="btn btn--bordered !border !border-gray-100 shadow"
                @click="settings"
              >
                <i class="ri-settings-2-line mr-2" />Settings
              </el-button>
            </div>
          </template>
        </app-integration-connect>
      </div>
    </div>

    <img
      v-if="integration.onboard?.image"
      :alt="integration.name"
      :src="integration.onboard.image"
      class="-mb-6 -ml-3 mt-4"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import AppIntegrationConnect from '@/modules/integration/components/integration-connect.vue';

const emit = defineEmits(['allowRedirect', 'inviteColleagues']);
const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const loadingDisconnect = ref(false);

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
  () => props.integration.status === 'pending-action',
);
const isWaitingApproval = computed(
  () => props.integration.status === 'waiting-approval',
);
const isNeedsToBeReconnected = computed(
  () => props.integration.status === 'needs-reconnect',
);

const handleDisconnect = () => {
  loadingDisconnect.value = true;

  store.dispatch('integration/doDestroy', props.integration.id).finally(() => {
    loadingDisconnect.value = false;
  });
};

const onConnect = (connect) => {
  emit('allowRedirect', true);
  connect();
};
</script>
