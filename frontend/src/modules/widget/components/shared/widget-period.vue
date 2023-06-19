<template>
  <div class="flex text-xs text-gray-600">
    <div
      v-for="option in options"
      :key="option.value"
      class="h-8 border-solid border-gray-200 border-r border-y first:border-l flex items-center
       justify-center transition hover:bg-gray-50 cursor-pointer first:rounded-l-md last:rounded-r-md"
      :class="`${getPeriodClass(option.value)} ${
        props.module === 'dashboard' ? 'px-3' : 'px-2'
      }`"
      @click="setPeriod(option)"
    >
      {{ option.label }}
    </div>
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  watch,
} from 'vue';
import {
  SEVEN_DAYS_PERIOD_FILTER,
  FOURTEEN_DAYS_PERIOD_FILTER,
  THREE_MONTHS_PERIOD_FILTER,
  DASHBOARD_PERIOD_OPTIONS,
  WIDGET_PERIOD_OPTIONS,
  DAILY_GRANULARITY_FILTER,
  WEEKLY_GRANULARITY_FILTER,
  MONTHLY_GRANULARITY_FILTER,
} from '@/modules/widget/widget-constants';

const emits = defineEmits(['onUpdate']);
const props = defineProps({
  period: {
    type: Object,
    default: () => SEVEN_DAYS_PERIOD_FILTER,
  },
  module: {
    type: String,
    default: 'dashboard',
  },
  template: {
    type: String,
    default: null,
  },
  widget: {
    type: String,
    default: null,
  },
  granularity: {
    type: Object,
    default: () => DAILY_GRANULARITY_FILTER,
  },
  options: {
    type: Array,
    default: () => null,
  },
});

const options = computed(() => {
  if (props.module === 'dashboard') {
    return DASHBOARD_PERIOD_OPTIONS;
  }

  if (props.options) {
    return props.options;
  }

  const { value: granularity } = props.granularity;

  // Computed available period options according to selected granlarity
  // WEEKLY
  if (granularity === WEEKLY_GRANULARITY_FILTER.value) {
    return WIDGET_PERIOD_OPTIONS.slice(1);
  } if (
    // MONTHLY
    granularity === MONTHLY_GRANULARITY_FILTER.value
  ) {
    return WIDGET_PERIOD_OPTIONS.slice(3);
  }

  // DAILY
  return WIDGET_PERIOD_OPTIONS;
});

watch(
  () => props.granularity,
  (granularity) => {
    // Update selected period wheneve selected granularity changes
    // WEEKLY
    // Update if period was previously 7d
    if (
      granularity.value
        === WEEKLY_GRANULARITY_FILTER.value
      && props.period.label === SEVEN_DAYS_PERIOD_FILTER.label
    ) {
      emits('onUpdate', FOURTEEN_DAYS_PERIOD_FILTER);
    } else if (
      // MONTHLY
      // Update if period was previously 7d/14d/30d
      granularity.value
        === MONTHLY_GRANULARITY_FILTER.value
      && props.period.granularity === 'day'
    ) {
      emits('onUpdate', THREE_MONTHS_PERIOD_FILTER);
    }
  },
);

const getPeriodClass = (value) => (props.period.value === value
  ? 'bg-gray-100 font-medium text-gray-900'
  : 'bg-white');

const setPeriod = (period) => {
  emits('onUpdate', period);

  if (props.module !== 'dashboard') {
    window.analytics.track('Filter widget', {
      period,
      template: props.template,
      widget: props.widget,
    });
  }
};
</script>

<script>
export default {
  name: 'AppWidgetPeriod',
};
</script>
