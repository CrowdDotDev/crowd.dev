<template>
  <app-widget-area
    v-if="props.data"
    class="chart"
    :datasets="props.datasets"
    :data="parsedData"
    :chart-options="
      chartOptions('area', dashboardChartOptions)
    "
    granularity="day"
  />
  <div v-else class="text-center py-11 text-xs text-gray-400 italic">
    No data
  </div>
</template>

<script setup lang="ts">
import { chartOptions } from '@/modules/report/templates/template-chart-config';
import { dashboardChartOptions } from '@/modules/dashboard/dashboard.chart';
import { computed } from 'vue';
import AppWidgetArea from '@/modules/widget/components/shared/widget-area.vue';

const props = defineProps<{
  data: any,
  datasets: any
}>();

const parsedData = computed(() => props.data.reduce((obj, item) => ({
  ...obj,
  [item.date]: item.count,
}), {}));

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
