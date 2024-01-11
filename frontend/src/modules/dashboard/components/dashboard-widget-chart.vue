<template>
  <app-widget-area
    v-if="props.data"
    class="chart"
    :datasets="props.datasets"
    :result-set="props.data"
    :chart-options="
      chartOptions('area', dashboardChartOptions)
    "
    granularity="day"
  />
</template>

<script setup lang="ts">
import AppWidgetArea from '@/modules/widget/components/shared/widget-area.vue';
import { chartOptions } from '@/modules/report/templates/template-chart-config';
import { dashboardChartOptions } from '@/modules/dashboard/dashboard.chart';

const props = defineProps<{
  data: any,
  datasets: any
}>();
</script>

<script lang="ts">
export default {
  name: 'AppDashboardWidgetChart',
};
</script>

<style lang="scss">
.chart {
  div {
    line-height: 112px !important;
    height: auto !important;
  }
  .cube-widget-chart {
    padding: 0;
    min-height: 0;
  }
  canvas {
    height: 112px;
  }
}
</style>
