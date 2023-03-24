<template>
  <div class="cube-widget-chart" :class="componentType">
    <component
      :is="componentType"
      ref="chart"
      width="500px"
      :data="data"
      v-bind="customChartOptions"
    ></component>
  </div>
</template>

<script>
export default {
  name: 'AppWidgetBar'
}
</script>

<script setup>
import { defineProps, computed } from 'vue'
import cloneDeep from 'lodash/cloneDeep'

const componentType = 'bar-chart'

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
  query: {
    type: Object,
    default: null
  }
})

const customChartOptions = cloneDeep(props.chartOptions)

const loading = computed(
  () => !props.resultSet?.loadResponses
)

const series = (resultSet) => {
  const pivot = resultSet.series()
  const series = []

  if (resultSet.loadResponses.length > 0) {
    resultSet.loadResponses.forEach((_, index) => {
      const prefix =
        resultSet.loadResponses.length === 1
          ? ''
          : `${index},`
      const data = pivot.map((p) => [
        p.x,
        p[`${prefix}${props.datasets[index].measure}`]
      ])

      series.push({
        name: props.datasets[index].name,
        data: [['average', 145]],
        ...{
          dataset: props.datasets[index]
        }
      })
    })
  }

  return series
}

const data = computed(() => {
  if (loading.value) {
    return []
  }

  return series(props.resultSet)
})
</script>
