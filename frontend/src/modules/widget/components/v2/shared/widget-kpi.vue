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
          ></i>
          <span class="ml-1">{{
            formatPercentage(growth)
          }}</span>
          <span class="ml-1"
            >({{ formatNumber(computedGrowthValue) }})</span
          >
        </div>
        <span
          v-else
          class="text-sm leading-none inline-flex items-center px-0.5"
          >=</span
        >
      </div>
      <div class="text-2xs text-gray-400">
        {{ vsLabel }}
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  formatNumber,
  formatPercentage
} from '@/utils/number'
import { defineProps, computed } from 'vue'

const props = defineProps({
  currentValue: {
    type: Number,
    default: null
  },
  previousValue: {
    type: Number,
    default: null
  },
  vsLabel: {
    type: String,
    default: 'vs. previous period'
  }
})

const growth =
  props.previousValue === 0
    ? props.currentValue !== 0
      ? 100
      : 0
    : ((props.currentValue - props.previousValue) * 100) /
      props.previousValue

const computedGrowthValue = computed(() => {
  const value = props.currentValue - props.previousValue
  return growth < 0 ? value * -1 : value
})

const computedGrowthClass = computed(() => {
  if (growth === 0) {
    return 'bg-blue-100 text-blue-700'
  } else if (growth > 0 || isNaN(growth)) {
    return 'bg-green-50 text-green-700'
  } else {
    return 'bg-red-50 text-red-700'
  }
})

const computedGrowthIcon = computed(() => {
  if (growth === 0 || isNaN(growth)) {
    return ''
  } else if (growth > 0) {
    return 'ri-arrow-up-line'
  } else {
    return 'ri-arrow-down-line'
  }
})
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
