<template>
  <div class="widget-kpi">
    <div class="current-value">
      {{ formatNumber(currentValue) }}
    </div>
    <div class="flex items-center gap-2 mt-2">
      <div class="growth" :class="computedGrowthClass">
        <i
          class="text-sm leading-none inline-flex items-center"
          :class="computedGrowthIcon"
        ></i>
        <span class="ml-1"
          >{{
            growth < 0
              ? formatNumber(growth) * -1
              : formatNumber(growth)
          }}%</span
        >
        <span class="ml-1"
          >({{ formatNumber(previousValue) }})</span
        >
      </div>
      <div class="text-2xs text-gray-400">
        {{ vsLabel }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatNumber } from '@/utils/number'
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
  ((props.currentValue - props.previousValue) * 100) /
  props.previousValue

const computedGrowthClass = computed(() => {
  if (growth === 0) {
    return 'bg-gray-50 text-gray-700'
  } else if (growth > 0) {
    return 'bg-green-50 text-green-700'
  } else {
    return 'bg-red-50 text-red-700'
  }
})

const computedGrowthIcon = computed(() => {
  if (growth === 0) {
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
