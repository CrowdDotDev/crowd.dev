<template>
  <canvas ref="canvas" />
</template>

<script lang="ts" setup>
import {
  Chart,
} from 'chart.js';
import { onMounted, ref } from 'vue';
import { ChartConfig } from '@/config/charts';

const props = defineProps<{
  config: ChartConfig,
  data: any,
  params: any,
}>();

const canvas = ref();
const chart = ref<Chart | null>();

const renderChart = () => {
  if (!canvas.value) {
    return;
  }
  const ctx = canvas.value.getContext('2d');
  const config = props.config(ctx, props.data, props.params);

  chart.value = new Chart(ctx, config);
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
