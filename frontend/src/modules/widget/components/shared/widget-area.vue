<template>
  <div v-if="!emptyData" class="widget-chart" :class="componentType">
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
import { computed, onMounted, ref } from 'vue';
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
  chartData: {
    type: Array,
    required: true,
  },
  chartOptions: {
    type: Object,
    default: () => {},
  },
  isGridMinMax: {
    type: Boolean,
    default: false,
  },
  showMinAsValue: {
    type: Boolean,
    default: false,
  },
});

const highestValue = ref(0);
const lowestValue = ref(0);
const dataset = ref({});
const emptyData = ref(false);

const buildSeriesDataset = (d, index) => {
  const seriesDataset = {
    ...dataset.value,
    ...props.datasets[index],
  };

  const { pointHoverBorderColor, borderColor, backgroundColor } = seriesDataset;
  const grey = 'rgba(180,180,180)';
  const transparent = 'rgba(255,255,255,0)';

  return {
    ...seriesDataset,
    pointHoverBorderColor: (ctx) => {
      const isAfterPenultimatePoint = ctx.dataIndex >= d.length - 2;
      return isAfterPenultimatePoint ? grey : pointHoverBorderColor;
    },
    segment: {
      borderColor: (ctx) => {
        const isLastPoint = ctx.p1DataIndex === d.length - 1;
        return isLastPoint ? grey : borderColor;
      },
      backgroundColor: (ctx) => {
        const isLastPoint = ctx.p1DataIndex === d.length - 1;
        return isLastPoint ? transparent : backgroundColor;
      },
    },
  };
};

// Parse chartData into data that can be consumed by area-chart component
const series = (chartData) => {
  const computedSeries = [];

  if (chartData.length > 0) {
    const computedData = chartData.map((p) => [p.date, p.count]);
    highestValue.value = Math.max(...computedData.map((d) => d[1]));
    lowestValue.value = Math.min(...computedData.map((d) => d[1]));

    emit('on-highest-number-calculation', highestValue.value);
    computedSeries.push({
      name: props.datasets[0]?.name,
      data: computedData,
      dataset: buildSeriesDataset(computedData, 0),
    });
  }

  if (!computedSeries.some((s) => !!s?.data?.length)) {
    emptyData.value = true;
  }

  return computedSeries;
};

const data = computed(() => {
  if (emptyData.value) {
    return [];
  }
  return series(props.chartData);
});

const customChartOptions = computed(() => {
  const options = cloneDeep(props.chartOptions);

  options.library.plugins.tooltip.external = (context) => externalTooltipHandler(context, () => {
    const point = context.tooltip.dataPoints.find((p) => p.datasetIndex === 0);
    const date = data.value[0].data[point.dataIndex][0];
    emit('on-view-more-click', date);
  });

  if (props.isGridMinMax) {
    options.library.scales.y.max = highestValue.value;
    options.library.scales.y.ticks.stepSize = highestValue.value;
  }

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
  const canvas = document.querySelector('.widget-chart canvas');
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
