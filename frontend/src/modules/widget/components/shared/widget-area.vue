<template>
  <div v-if="!emptyData" class="cube-widget-chart" :class="componentType">
    <component
      :is="componentType"
      ref="chart"
      :data="data"
      v-bind="customChartOptions"
    />
  </div>
  <app-widget-empty v-else />
</template>

<script setup>
import {
  computed, onMounted, ref,
} from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import { externalTooltipHandler } from '@/modules/report/tooltip';
import AppWidgetEmpty from '@/modules/widget/components/shared/widget-empty.vue';

const componentType = 'area-chart';

const emit = defineEmits(['on-view-more-click', 'on-highest-number-calculation']);
const props = defineProps({
  datasets: {
    type: Array,
    default: () => [],
  },
  data: {
    type: null,
    required: true,
  },
  chartOptions: {
    type: Object,
    default: () => {},
  },
  granularity: {
    type: String,
    required: true,
  },
  isGridMinMax: {
    type: Boolean,
    default: false,
  },
  showMinAsValue: {
    type: Boolean,
    default: false,
  },
  pivotModifier: {
    type: Function,
    default: () => {},
  },
});

const highestValue = ref(0);
const lowestValue = ref(0);
const dataset = ref({});
const emptyData = ref(false);

const customChartOptions = computed(() => {
  const options = cloneDeep(props.chartOptions);

  // Customize external tooltip
  // Handle View more button click
  // Get dataPoint from tooltip and extract the date
  options.library.plugins.tooltip.external = (
    context,
  ) => externalTooltipHandler(context, () => {
    const point = context.tooltip.dataPoints.find(
      (p) => p.datasetIndex === 0,
    );
    const date = data.value[0].data[point.dataIndex][0];
    emit('on-view-more-click', date);
  });

  // Only show bottom and top grid lines by setting
  // the stepSize to be the maxValue
  if (props.isGridMinMax) {
    options.library.scales.y.max = highestValue.value;
    options.library.scales.y.ticks.stepSize = highestValue.value;
  }

  // Min value of the graph should be the min data point
  if (props.showMinAsValue) {
    if (lowestValue.value !== highestValue.value) {
      options.library.scales.y.min = lowestValue.value;
    } else if (lowestValue.value !== 0) {
      options.library.scales.y.afterBuildTicks = (axis) => {
        Object.assign(axis, {
          ticks: axis.ticks.filter((t) => t.value !== 0),
        });
      };
    }
  }

  return options;
});

const paintDataSet = () => {
  const canvas = document.querySelector(
    '.cube-widget-chart canvas',
  );
  if (canvas && customChartOptions.value?.computeDataset) {
    dataset.value = customChartOptions.value.computeDataset(canvas);
  }
};

onMounted(async () => {
  paintDataSet();
});
</script>

<script>
export default {
  name: 'AppWidgetArea',
};
</script>
