<template>
  <div class="widget-kpi">
    <div class="current-value">
      {{ formatNumber(currentValue) }}
    </div>
    <div class="flex items-center gap-2 mt-2">
      <div class="growth" :class="computedGrowthClass">
        <div v-if="growth !== 0" class="flex items-center">
          <i
            class="text-sm leading-none inline-flex items-center"
            :class="computedGrowthIcon"
          />
          <span class="ml-1">{{
            formatPercentage(growth)
          }}</span>
          <span class="ml-1">({{ formatNumber(computedGrowthValue) }})</span>
        </div>
        <span
          v-else
          class="text-sm leading-none inline-flex items-center px-0.5"
        >=</span>
      </div>
      <div class="text-2xs text-gray-400">
        {{ vsLabel }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import {
  formatNumber,
  formatPercentage,
} from '@/utils/number';

const props = defineProps({
  currentValue: {
    type: Number,
    default: null,
  },
  previousValue: {
    type: Number,
    default: null,
  },
  vsLabel: {
    type: String,
    default: 'vs. previous period',
  },
});

const growth = computed(() => {
  if (props.previousValue === 0) {
    return props.currentValue !== 0 ? 100 : 0;
  }
  return ((props.currentValue - props.previousValue) * 100)
      / props.previousValue;
});

const computedGrowthValue = computed(() => {
  const value = props.currentValue - props.previousValue;
  return growth.value < 0 ? value * -1 : value;
});

const computedGrowthClass = computed(() => {
  if (growth.value === 0) {
    return 'bg-blue-100 text-blue-700';
  } if (growth.value > 0 || Number.isNaN(growth)) {
    return 'bg-green-50 text-green-700';
  }
  return 'bg-red-50 text-red-700';
});

const computedGrowthIcon = computed(() => {
  if (growth.value === 0 || Number.isNaN(growth)) {
    return '';
  } if (growth.value > 0) {
    return 'ri-arrow-up-line';
  }
  return 'ri-arrow-down-line';
});
</script>

<style lang="scss">
.widget-kpi {
  .current-value {
    @apply text-gray-900 font-medium text-2xl;
  }
  .growth {
    @apply text-xs font-medium px-1 py-1 rounded-md flex items-center;
  }
}
</style>
