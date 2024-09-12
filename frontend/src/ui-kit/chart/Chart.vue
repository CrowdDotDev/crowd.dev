<template>
  <div>
    <canvas ref="canvas" />
  </div>
</template>

<script lang="ts" setup>
import {
  Chart, ChartData, ChartOptions, ChartType,
} from 'chart.js';
import { onMounted, ref, watch } from 'vue';

const props = defineProps<{
  type: ChartType,
  data:(context: any) => ChartData,
  options: (context: any) => ChartOptions,
}>();

const canvas = ref();
const chart = ref<Chart | null>();

const renderChart = () => {
  if (!canvas.value) {
    return;
  }
  const ctx = canvas.value.getContext('2d');
  const data = props.data(ctx);
  const options = props.options(ctx);

  chart.value = new Chart(ctx, {
    type: props.type, // You can change this to any chart type (line, pie, etc.)
    data,
    options,
  });
};

onMounted(() => {
  renderChart();
});
</script>

<script lang="ts">
export default {
  name: 'LfChart',
};
</script>
