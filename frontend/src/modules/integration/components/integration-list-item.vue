<template>
  <div class="s panel" :class="computedClass">
    <div class="flex items-center justify-between">
      <img :alt="integration.name" :src="integration.image" class="h-6 mb-4" />
      <div>
        <div class="mb-1 flex justify-end">
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
            <div
              v-loading="true"
              class="app-page-spinner !relative h-4 !w-4 mr-2 !min-h-fit"
            />

            <span class="text-xs text-gray-900 mr-2">In progress</span>
            <el-tooltip
              content="Fetching first activities from an integration might take a few minutes"
              placement="top"
            >
              <i class="ri-question-line text-gray-400" />
            </el-tooltip>
          </div>
        </div>
        <div class="h-5 leading-5 text-end">
          <el-tooltip
            v-if="isDone"
            :content="lastSynced.absolute"
            placement="top"
          >
            <span class="text-3xs italic text-gray-500">{{ lastSynced.relative }}</span>
          </el-tooltip>
        </div>
      </div>
    </div>

    <div>
      <div class="flex mb-2">
        <span class="block font-semibold">{{ integration.name }}</span>
        <span v-if="integration.premium" class="text-2xs text-brand-500 ml-1">{{
          FeatureFlag.premiumFeatureCopy()
        }}</span>
        <span v-if="integration.scale" class="text-2xs text-brand-500 ml-1">{{
          FeatureFlag.scaleFeatureCopy()
        }}</span>
      </div>
      <span class="block mb-6 text-xs text-gray-500">{{
        integration.description
      }}</span>
      <app-integration-connect :integration="integration">
        <template
          #default="{
            connect,
            connected,
            settings,
            hasSettings,
            hasIntegration,
          }"
        >
          <div class="flex items-center justify-between">
            <el-button
              v-if="!connected"
              class="btn btn--secondary btn--md"
              @click="connect"
            >
              {{
                (integration.premium || integration.scale) && !hasIntegration
                  ? "Upgrade Plan"
                  : "Connect"
              }}
            </el-button>
            <el-button
              v-else
              class="btn btn--secondary !text-red-500 btn--md"
              :loading="loadingDisconnect"
              @click="handleDisconnect"
            >
              Disconnect
            </el-button>
            <el-button
              v-if="connected && hasSettings"
              class="btn btn-link btn-link--md btn-link--primary"
              @click="settings"
            >
              <i class="ri-settings-2-line mr-2" />Settings
            </el-button>
          </div>
        </template>
      </app-integration-connect>
    </div>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed, onMounted, ref } from 'vue';
import { FeatureFlag } from '@/utils/featureFlag';
import AppIntegrationConnect from '@/modules/integration/components/integration-connect.vue';
import { isCurrentDateAfterGivenWorkingDays } from '@/utils/date';
import { ERROR_BANNER_WORKING_DAYS_DISPLAY } from '@/modules/integration/integration-store';
import moment from 'moment';

const store = useStore();
const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

onMounted(() => {
  moment.updateLocale('en', {
    relativeTime: {
      s: '1s',
      ss: '%ds',
      m: '1min',
      mm: '%dmin',
      h: '1h',
      hh: '%dh',
      d: '1d',
      dd: '%dd',
    },
  });
});

const computedClass = computed(() => ({
  'integration-custom': props.integration.platform === 'custom',
}));

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

const lastSynced = computed(() => ({
  absolute: moment(props.integration.updatedAt).format('MMM DD, YYYY HH:mm'),
  relative: `last synced ${moment(props.integration.updatedAt).fromNow()}`,
}));

const loadingDisconnect = ref(false);

const handleDisconnect = async () => {
  loadingDisconnect.value = true;
  await store.dispatch('integration/doDestroy', props.integration.id);
  loadingDisconnect.value = false;
};
</script>

<script>
export default {
  name: 'AppIntegrationListItem',
};
</script>

<style lang="scss">
.integration-custom {
  background: linear-gradient(
      117.72deg,
      #DBEBFE 0%,
      rgba(253, 237, 234, 0) 100%
    ),
    #ffffff;
}
</style>
