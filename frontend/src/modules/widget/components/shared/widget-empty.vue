<template>
  <div
    class="min-h-88 py-12 flex items-center justify-center"
  >
    <div class="text-center">
      <i class="text-gray-200 text-5xl" :class="icon" />
      <div class="text-gray-600 text-sm font-semibold">
        No data found
      </div>
      <div
        v-if="withDescription"
        class="text-gray-400 text-2xs font-semibold"
      >
        Try to select a different time period
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

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
    return 'ri-bar-chart-fill';
  }

  return 'ri-list-unordered';
});
</script>
