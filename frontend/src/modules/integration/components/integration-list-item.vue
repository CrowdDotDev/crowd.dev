<template>
  <div
    class="border border-gray-200 rounded-lg flex flex-col overflow-hidden"
    :class="computedClass"
  >
    <div class="pt-5 px-5 pb-8">
      <div class="flex justify-between">
        <div>
          <img
            :alt="integration.name"
            :src="integration.image"
            class="w-6 mb-3"
          />
        </div>
        <div />
      </div>
      <h6 class="text-base font-semibold text-black pb-2">
        {{ integration.name }}
      </h6>
      <p class="text-xs leading-5 text-gray-500">
        {{ integration.description }}
      </p>
    </div>
    <div class="flex-grow" />

    <app-integration-connect :integration="integration">
      <template
        #default="{
          connect,
          connected,
          settings,
          hasSettings,
          settingsComponent,
        }"
      >
        <!-- Connect -->
        <div v-if="!connected" class="px-5 pb-5">
          <lf-button type="secondary" class="w-full" @click="connect">
            <i class="ri-link" /> Connect
          </lf-button>
        </div>
        <div
          v-else-if="isInProgress && !progressError"
          class="bg-gray-50 py-3 px-5 min-h-14"
        >
          <app-integration-progress-bar :progress="selectedProgress" />
        </div>
        <div
          v-else
          class="bg-gray-50 py-3 px-5 min-h-14 flex items-center justify-between"
        >
          <div>
            <component
              :is="settingsComponent"
              v-if="connected && settingsComponent"
              :integration="integration"
            />
            <el-tooltip
              v-if="isDone"
              :content="lastSynced.absolute"
              placement="top"
            >
              <p class="text-3xs text-gray-500">
                {{ lastSynced.relative }}
              </p>
            </el-tooltip>
            <p v-if="progressError" class="text-3xs text-gray-500 mt-1">
              <i class="ri-alert-line text-yellow-600" /> Error loading progress
            </p>
          </div>
          <div>
            <el-dropdown placement="bottom-end">
              <lf-button size="small" type="secondary-ghost" :icon-only="true">
                <i class="ri-more-fill" />
              </lf-button>
              <template #dropdown>
                <el-dropdown-item
                  v-if="hasSettings"
                  class="cursor-pointer"
                  @click="settings"
                >
                  <i class="ri-settings-3-line" />Integration settings
                </el-dropdown-item>
                <el-dropdown-item
                  class="cursor-pointer"
                  @click="handleDisconnect"
                >
                  <i class="ri-link-unlink !text-red-500" /><span
                    class="text-red-500"
                  >Disconnect</span>
                </el-dropdown-item>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>
    </app-integration-connect>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed, onMounted, ref } from 'vue';
import AppIntegrationConnect from '@/modules/integration/components/integration-connect.vue';
import { isCurrentDateAfterGivenWorkingDays, formatDateToTimeAgoForIntegrations } from '@/utils/date';
import { ERROR_BANNER_WORKING_DAYS_DISPLAY } from '@/modules/integration/integration-store';
import moment from 'moment';
import LfButton from '@/ui-kit/button/Button.vue';
import AppIntegrationProgressBar from '@/modules/integration/components/integration-progress-bar.vue';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import {
  EventType,
  FeatureEventKey,
} from '@/shared/modules/monitoring/types/event';

const store = useStore();
const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
  progress: {
    type: Object,
    default: () => {},
  },
  progressError: {
    type: Boolean,
    default: false,
  },
});

const { trackEvent } = useProductTracking();

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

const selectedProgress = computed(() => (props.progress || []).find((p) => p.platform === props.integration.platform));

const isDone = computed(
  () => props.integration.status === 'done'
    || (props.integration.status === 'error'
      && !isCurrentDateAfterGivenWorkingDays(
        props.integration.updatedAt,
        ERROR_BANNER_WORKING_DAYS_DISPLAY,
      )),
);

const isInProgress = computed(() => props.integration.status === 'in-progress');

const lastSynced = computed(() => {
  if (props.integration.platform === 'git') {
    return {
      absolute: moment().subtract(1, 'hours').format('MMM DD, YYYY HH:mm'),
      relative: 'Last data check completed 1 hour ago',
    };
  }

  return {
    absolute: moment(props.integration.lastProcessedAt).format(
      'MMM DD, YYYY HH:mm',
    ),
    relative: `Last data check completed ${formatDateToTimeAgoForIntegrations(
      props.integration.lastProcessedAt,
    )}`,
  };
});

const loadingDisconnect = ref(false);

const handleDisconnect = async () => {
  trackEvent({
    key: FeatureEventKey.DISCONNECT_INTEGRATION,
    type: EventType.FEATURE,
    properties: {
      platform: props.integration.platform,
    },
  });

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
      #dbebfe 0%,
      rgba(253, 237, 234, 0) 100%
    ),
    #ffffff;
}
</style>
