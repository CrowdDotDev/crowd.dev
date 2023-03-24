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
import { defineProps, defineEmits, computed } from 'vue'
import cloneDeep from 'lodash/cloneDeep'

const componentType = 'bar-chart'

const emit = defineEmits(['onAverageCalculation'])
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
  showAsAverage: {
    type: Boolean,
    default: false
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
      let data = pivot[index].series.map((p) => [
        p.x,
        p.value
      ])

      // Show one bar for the DataPointsAverage
      if (props.showAsAverage) {
        const average = Math.floor(
          data.reduce((valueA, [, valueB]) => {
            return valueA + valueB
          }, 0) / data.length
        )

        emit('onAverageCalculation', average)
        data = [['average', average]]
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

const data = computed(() => {
  if (loading.value) {
    return []
  }

  return series(props.resultSet)
})
</script>
