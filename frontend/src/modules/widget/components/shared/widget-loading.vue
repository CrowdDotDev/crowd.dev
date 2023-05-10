<template>
  <!-- Chart and Table widgets -->
  <div
    v-if="type !== 'kpi'"
    class="flex items-center justify-center"
    :class="`${
      size === 'normal' ? 'min-h-88 py-12' : 'min-h-24 py-4'
    }`"
  >
    <div class="text-center">
      <i
        class="animate-pulse text-gray-200 text-5xl"
        :class="icon"
      />
      <div class="text-gray-600 text-sm font-semibold">
        Loading your data...
      </div>
    </div>
  </div>

  <!-- KPI widgets -->
  <div v-else class="w-full flex flex-col justify-center">
    <app-loading
      class="mb-4"
      height="24px"
      width="30%"
      radius="2px"
    />
    <app-loading height="16px" radius="2px" />
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';

const props = defineProps({
  type: {
    type: String,
    default: 'chart',
  },
  size: {
    type: String,
    default: 'normal',
  },
});

const icon = computed(() => {
  if (props.type === 'chart') {
    return 'ri-bar-chart-fill';
  }

  return 'ri-list-unordered';
});
</script>
