<template>
  <div
    class="flex items-center justify-between pb-5 border-b border-gray-200"
  >
    <div class="flex items-center">
      <h5 class="text-lg font-semibold leading-7 pr-3">
        {{ props.title }}
      </h5>
      <app-loading
        v-if="props.totalLoading"
        height="20px"
        width="60px"
      />
      <p v-else class="text-xs text-gray-500 leading-5">
        Total: {{ formatNumberToCompact(props.total) }}
      </p>
    </div>
    <div class="flex items-center">
      <router-link
        v-if="props.route && props.buttonTitle"
        :to="{
          ...props.route,
          query: {
            ...props.route.query,
            projectGroup: selectedProjectGroup?.id,
          },
        }"
      >
        <lf-button
          type="primary-link"
          size="small"
          class="w-full leading-5 text-primary-500"
        >
          {{ props.buttonTitle }}
        </lf-button>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { formatNumberToCompact } from '@/utils/number';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import LfButton from '@/ui-kit/button/Button.vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  totalLoading: {
    type: Boolean,
    required: false,
    default: false,
  },
  total: {
    type: Number,
    required: false,
    default: null,
  },
  route: {
    type: Object,
    required: false,
    default: null,
  },
  buttonTitle: {
    type: String,
    required: false,
    default: '',
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);
</script>

<script>
export default {
  name: 'AppDashboardWidgetHeader',
};
</script>
