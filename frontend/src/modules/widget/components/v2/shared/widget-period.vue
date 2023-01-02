<template>
  <div class="flex text-xs text-gray-600">
    <div
      v-for="option in options"
      :key="option.value"
      class="h-8 border-solid border-gray-200 border-r border-y first:border-l flex items-center justify-center transition hover:bg-gray-50 cursor-pointer first:rounded-l-md last:rounded-r-md"
      :class="`${getPeriodClass(option.value)} ${
        props.module === 'dashboard' ? 'px-3' : 'px-2'
      }`"
      @click="setPeriod(option)"
    >
      {{ option.label }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppWidgetPeriod'
}
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import {
  SEVEN_DAYS_PERIOD_FILTER,
  DASHBOARD_PERIOD_OPTIONS,
  WIDGET_PERIOD_OPTIONS
} from '@/modules/widget/widget-periods'

const emits = defineEmits(['onUpdate'])
const props = defineProps({
  period: {
    type: Object,
    default: () => SEVEN_DAYS_PERIOD_FILTER
  },
  module: {
    type: String,
    default: 'dashboard'
  }
})

const options = computed(() =>
  props.module === 'dashboard'
    ? DASHBOARD_PERIOD_OPTIONS
    : WIDGET_PERIOD_OPTIONS
)

const getPeriodClass = (value) => {
  return props.period.value === value
    ? 'bg-gray-100 font-medium text-gray-900'
    : 'bg-white'
}

const setPeriod = (period) => {
  emits('onUpdate', period)
}
</script>
