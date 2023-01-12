<template>
  <div class="cube-widget-chart" :class="componentType">
    <component
      :is="componentType"
      ref="chart"
      :data="data"
      v-bind="{
        ...customChartOptions,
        dataset
      }"
    ></component>
  </div>
</template>

<script>
export default {
  name: 'AppWidgetArea'
}
</script>

<script setup>
import { defineProps, computed, onMounted, ref } from 'vue'
import cloneDeep from 'lodash/cloneDeep'
import { parseAxisLabel } from '@/utils/reports'

const componentType = 'area-chart'

const props = defineProps({
  datasets: {
    type: Array,
    default: () => []
  },
  resultSet: {
    type: null,
    required: true
  },
  chartOptions: {
    type: Object,
    default: () => {}
  },
  granularity: {
    type: String,
    required: true
  },
  isGridMinMax: {
    type: Boolean,
    default: false
  }
})

const customChartOptions = cloneDeep(props.chartOptions)
customChartOptions.library.scales.x.ticks.callback = (
  value
) => parseAxisLabel(value, props.granularity)

const dataset = ref(null)

const loading = computed(
  () => !props.resultSet?.loadResponses
)

const data = computed(() => {
  if (loading.value) {
    return []
  }

  return series(props.resultSet)
})

onMounted(async () => {
  paintDataSet()
})

const paintDataSet = () => {
  const canvas = document.querySelector(
    '.cube-widget-chart canvas'
  )
  if (canvas && props.chartOptions?.computeDataset) {
    dataset.value =
      props.chartOptions.computeDataset(canvas)
  }
}

const series = (resultSet) => {
  // For line & area charts
  const pivot = resultSet.chartPivot()
  const series = []

  if (resultSet.loadResponses.length > 0) {
    resultSet.loadResponses.forEach((_, index) => {
      const prefix =
        resultSet.loadResponses.length === 1
          ? ''
          : `${index},` // has more than 1 dataset
      const data = pivot.map((p) => [
        p.x,
        p[`${prefix}${props.datasets[index].measure}`]
      ])

      if (props.isGridMinMax) {
        const maxValue = Math.max(...data.map((d) => d[1]))
        customChartOptions.library.scales.y.ticks.stepSize =
          maxValue
      }

      series.push({
        name: props.datasets[index].name,
        data,
        ...{
          dataset: props.datasets[index]
        }
      })
    })
  }

  return series
}
</script>
