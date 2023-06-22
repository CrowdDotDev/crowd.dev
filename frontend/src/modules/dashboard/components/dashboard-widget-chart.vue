<template>
  <app-cube-render :query="props.query(period, platform, segments)">
    <template #default="{ resultSet }">
      <app-widget-area
        class="chart"
        :datasets="props.datasets"
        :result-set="resultSet"
        :chart-options="
          chartOptions('area', dashboardChartOptions)
        "
        :granularity="DAILY_GRANULARITY_FILTER.value"
      />
    </template>
  </app-cube-render>
</template>

<script setup>
import { defineProps } from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppCubeRender from '@/shared/cube/cube-render.vue';
import AppWidgetArea from '@/modules/widget/components/shared/widget-area.vue';
import { chartOptions } from '@/modules/report/templates/template-chart-config';
import { dashboardChartOptions } from '@/modules/dashboard/dashboard.cube';
import { DAILY_GRANULARITY_FILTER } from '@/modules/widget/widget-constants';

const props = defineProps({
  query: {
    type: Function,
    required: true,
  },
  datasets: {
    type: Object,
    required: true,
  },
});

const { period, platform, segments } = mapGetters('dashboard');
</script>

<script>
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
