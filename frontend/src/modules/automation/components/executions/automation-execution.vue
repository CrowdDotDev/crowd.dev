<template>
  <div class="webhook-execution px-6 pb-6">
    <div class="flex items-center">
      <div
        :class="
          props.execution.state === 'success'
            ? 'text-green-500'
            : 'text-red-500'
        "
        class="flex items-center"
      >
        <lf-icon
          :name="props.execution.state === 'success'
            ? 'circle-line'
            : 'circle-xmark'"
          :size="20"
          class="mr-1"
        />
        <span class="font-medium text-sm">{{
          props.execution.state === 'success'
            ? 'Success'
            : 'Error'
        }}
        </span>
      </div>
      <div class="text-gray-500 ml-6 text-sm">
        Timestamp:
      </div>
      <div class="text-gray-900 ml-2 text-sm">
        {{ formattedDate(props.execution.executedAt) }}
      </div>
    </div>
    <div
      v-if="props.execution.state === 'error' && props.automation.type === 'slack'"
      class="rounded-md bg-yellow-50 border border-yellow-100 flex items-center justify-between py-3 px-4 mt-6"
    >
      <div class="flex items-center">
        <lf-icon name="triangle-exclamation" type="solid" :size="16" class="text-yellow-500 mr-3" />
        <span class="text-xs leading-5 text-gray-900">Please make sure you have the LFX notifier app installed in your Slack workspace.</span>
      </div>
      <el-button
        class="btn btn--primary btn--sm ml-4"
        @click="authenticateSlack()"
      >
        Install app
      </el-button>
    </div>
    <div
      v-if="props.execution.state === 'error' && (props.execution.error.message || props.execution.error.body)"
      class="vjs-tree-wrapper vjs-tree-wrapper--error mt-6"
    >
      <span
        class="font-medium block text-sm text-red-500"
        :class="{ 'mb-4': !!props.execution.error.body }"
      >
        {{ props.execution.error.message }}
      </span>
      <vue-json-pretty
        v-if="props.execution.error.body"
        :data="props.execution.error.body"
        :show-double-quotes="false"
        :show-line="false"
      />
    </div>

    <span class="font-medium block text-base mb-3 mt-6 text-gray-900">Payload</span>
    <div class="vjs-tree-wrapper">
      <vue-json-pretty
        :data="props.execution.payload"
        :show-double-quotes="false"
        :show-line="false"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import moment from 'moment';
import config from '@/config';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { AuthService } from '@/modules/auth/services/auth.service';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps({
  execution: {
    type: Object,
    default: () => {},
  },
  automation: {
    type: Object,
    default: () => {},
  },
});

const authStore = useAuthStore();
const { tenant } = storeToRefs(authStore);

const slackConnectUrl = computed(() => {
  const redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?activeTab=automations&success=true`;

  return `${config.backendUrl}/tenant/${
    tenant.value.id
  }/automation/slack?redirectUrl=${redirectUrl}&crowdToken=${AuthService.getToken()}`;
});

const authenticateSlack = () => {
  window.open(slackConnectUrl.value, '_self');
};

const formattedDate = (date) => moment(date).format('YYYY-MM-DD HH:mm:ss');
</script>

<script>
export default {
  name: 'AppAutomationExecution',
};
</script>

<style lang="scss">
.webhook-execution {
  .vjs-tree-wrapper {
    @apply p-4 rounded-md overflow-auto bg-gray-50;
    max-height: 430px;

    .vjs-tree {
      @apply text-xs;

      &.is-highlight,
      .vjs-tree-node:hover {
        @apply bg-gray-100;
      }
    }

    &--error {
      @apply bg-red-50;
      height: auto;
      max-height: 200px;
      .vjs-tree {
        &.is-highlight,
        .vjs-tree-node:hover {
          @apply bg-red-100;
        }
      }
    }
  }

  .vjs-value {
    &-string,
    &-boolean,
    &-number,
    &-array {
      @apply text-gray-900;
    }
  }

  .vjs-key {
    @apply text-gray-500;
  }
}
</style>
