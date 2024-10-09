<template>
  <div
    class="py-4 flex items-center justify-center"
  >
    <div class="flex flex-col items-center">
      <lf-icon :name="icon" :size="64" class="text-gray-200" />
      <p class="text-gray-600 text-small font-semibold text-center">
        No data found
      </p>
      <p
        v-if="withDescription"
        class="text-gray-400 text-tiny font-semibold leading-5 text-center"
      >
        Try to select a different time period
      </p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps({
  type: {
    type: String,
    default: 'chart',
  },
  withDescription: {
    type: Boolean,
    default: true,
  },
});

const icon = computed(() => {
  if (props.type === 'chart') {
    return 'bar-chart-fill';
  }

  return 'list-unordered';
});
</script>
