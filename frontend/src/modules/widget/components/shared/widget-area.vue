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
  resultSet: {
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
const loading = computed(
  () => !props.resultSet?.loadResponses,
);
const emptyData = ref(false);

const buildSeriesDataset = (d, index) => {
  const seriesDataset = {
    ...dataset.value,
    ...props.datasets[index],
  };

  // Default dataset colors
  const {
    pointHoverBorderColor,
    borderColor,
    backgroundColor,
  } = seriesDataset;

  // Colors to configure today on graph
  const grey = 'rgba(180,180,180)';
  const transparent = 'rgba(255,255,255,0)';

  // Add customization to data points and line segments
  // according to datapoint position
  return {
    ...seriesDataset,
    pointHoverBorderColor: (ctx) => {
      const isAfterPenultimatePoint = ctx.dataIndex >= d.length - 2;

      return isAfterPenultimatePoint
        ? grey
        : pointHoverBorderColor;
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

// Parse resultSet into data that can be consumed by area-chart component
const series = (resultSet) => {
  // For line & area charts
  const pivot = resultSet.chartPivot();

  if (props.pivotModifier) {
    props.pivotModifier(pivot);
  }

  const computedSeries = [];

  if (resultSet.loadResponses.length > 0) {
    resultSet.loadResponses.forEach((_, index) => {
      const prefix = resultSet.loadResponses.length === 1
        ? ''
        : `${index},`; // has more than 1 dataset
      const computedData = pivot.map((p) => [
        p.x,
        p[`${prefix}${props.datasets[index].measure}`] || 0,
      ]);

      highestValue.value = Math.max(...computedData.map((d) => d[1]));
      lowestValue.value = Math.min(...computedData.map((d) => d[1]));

      emit('on-highest-number-calculation', highestValue.value);
      computedSeries.push({
        name: props.datasets[index].name,
        data: computedData,
        ...{
          dataset: buildSeriesDataset(computedData, index),
        },
      });
    });
  }

  // Search for hidden datasets to add to the available series
  const hiddenDatasets = props.datasets
    .filter((d) => d.hidden)
    .map((d) => ({
      name: d.name,
      ...{
        dataset: d,
      },
    }));

  if (hiddenDatasets.length) {
    computedSeries.push(...hiddenDatasets);
  }

  if (!computedSeries.some((s) => !!s?.data?.length)) {
    emptyData.value = true;
  }

  return computedSeries;
};

const data = computed(() => {
  if (loading.value) {
    return [];
  }
  return series(props.resultSet);
});

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
