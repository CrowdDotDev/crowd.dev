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
import { i18n } from '@/i18n'

const componentType = 'area-chart'

const props = defineProps({
  widget: {
    type: Object,
    required: true
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
  () => !props.resultSet || !props.resultSet.loadResponse
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

const query = computed(() => {
  if (props.resultSet?.loadResponse) {
    return props.resultSet.loadResponse.pivotQuery
  }

  return null
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
  const seriesNames = resultSet.seriesNames()
  const pivot = resultSet.chartPivot()
  const series = []

  if (seriesNames.length > 0) {
    seriesNames.forEach((e) => {
      const data = pivot.map((p) => [p.x, p[e.key]])
      const { cube, dimension } = deconstructLabel(e.key)

      const name =
        dimension && dimension !== 'unknown'
          ? dimension
          : i18n('widget.cubejs.cubes.' + cube)
      series.push({ name, data })
    })
  } else {
    let name = undefined
    if (query.value.measures.length > 0) {
      const key = query.value.measures[0]
      const { cube, dimension } = deconstructLabel(key)
      name =
        dimension && dimension !== 'unknown'
          ? dimension
          : i18n('widget.cubejs.cubes.' + cube)
    }
    const data = pivot.map((p) => [p.x, 0])
    series.push({
      data,
      name
    })
  }

  return series
}

const deconstructLabel = (label) => {
  const dimension =
    label.split(',').length > 1
      ? label.split(',')[0]
      : query.value.dimensions.length
      ? 'unknown'
      : undefined

  const cube =
    dimension && dimension !== 'unknown'
      ? label.split(',')[1].split('.')[0]
      : label.split('.')[0]

  const measure = label.split('.')[1]

  return {
    dimension,
    cube,
    measure
  }
}
</script>
