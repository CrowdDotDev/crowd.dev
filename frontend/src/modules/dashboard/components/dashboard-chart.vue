<template>
  <lf-chart ref="chart" :data="computedData" :options="() => options" type="line" />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import LfChart from '@/ui-kit/chart/Chart.vue';
import { chartOptions } from '@/modules/report/templates/template-chart-config';
import moment from 'moment/moment';

const props = defineProps<{
  data: any,
}>();

const chart = ref();

const computedData = (ctx: any) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 100);
  gradient.addColorStop(0.38, 'rgba(0, 148, 255, 0.10)');
  gradient.addColorStop(1, 'rgba(0, 148, 255, 0.0)');

  return {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Data One',
        data: [40, 39, 10, 40, 39, 80, 40],
        borderColor: '#003778',
        tension: 0.25,
        showLine: true,
        fill: false,
        backgroundColor: gradient,
        pointRadius: 5,
        pointBorderColor: 'transparent',
        pointBackgroundColor: 'transparent',
        pointHoverBorderColor: '#003778',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderWidth: 2,
        spanGaps: true,
      },
    ],
  };
};

const options = {
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      ticks: {
        display: false,
      },
      grid: {
        display: false,
      },
    },
    x: {
      ticks: {
        callback(value: any) {
          return moment(value).format('MMM DD');
        },
        maxTicksLimit: 3,
        maxRotation: 0,
      },
    },
  },
  gradient: {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 100,
    stops: [
      {
        offset: 0.38,
        color: 'rgba(0, 148, 255, 0.10)',
      },
      {
        offset: 1,
        color: 'rgba(0, 148, 255, 0.00)',
      },
    ],
  },
};
</script>

<script lang="ts">
export default {
  name: 'LfDashboardChart',
};
</script>
