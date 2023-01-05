<template>
  <div class="cube-widget-chart" :class="componentType">
    <component
      :is="componentType"
      ref="chart"
      :data="data"
      v-bind="{
        ...chartOptions,
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
import {
  defineProps,
  computed,
  onMounted,
  nextTick,
  onUpdated,
  ref
} from 'vue'

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
  }
})

const dataset = ref(null)

const loading = computed(
  () => !props.resultSet?.loadResponse
)

const data = computed(() => {
  if (loading.value) {
    return []
  }

  return series(props.resultSet)
})

onMounted(async () => {
  await nextTick()

  paintDataSet()
})

onUpdated(() => {
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
      const data = pivot.map((p) => [
        p.x,
        p[`${index},${props.datasets[index].measure}`]
      ])

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
