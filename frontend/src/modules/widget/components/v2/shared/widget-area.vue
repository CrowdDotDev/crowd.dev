<template>
  <div class="cube-widget-chart" :class="componentType">
    <component
      :is="componentType"
      ref="chart"
      :data="data"
      v-bind="customChartOptions"
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
  defineEmits,
  defineProps,
  computed,
  onMounted,
  ref
} from 'vue'
import cloneDeep from 'lodash/cloneDeep'
import { parseAxisLabel } from '@/utils/reports'
import { externalTooltipHandler } from '@/modules/report/tooltip'

const componentType = 'area-chart'

const emit = defineEmits(['on-view-more-click'])
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
  },
  idealRangeAnnotation: {
    type: Object,
    default: null
  }
})

const customChartOptions = cloneDeep(props.chartOptions)

// Customize external tooltip
// Handle View more button click
// Get dataPoint from tooltip and extract the date
customChartOptions.library.plugins.tooltip.external = (
  context
) =>
  externalTooltipHandler(context, () => {
    const point = context.tooltip.dataPoints.find(
      (p) => p.datasetIndex === 0
    )
    const date = data.value[0].data[point.dataIndex][0]

    emit('on-view-more-click', date)
  })

// Add idealRange annotation if passed through props
if (props.idealRangeAnnotation) {
  customChartOptions.library.plugins.annotation = {
    annotations: {
      idealRange: props.idealRangeAnnotation
    }
  }
}

// Customize x ticks
if (!customChartOptions.library.scales.x.ticks.callback) {
  customChartOptions.library.scales.x.ticks.callback = (
    value
  ) => parseAxisLabel(value, props.granularity)
}

const dataset = ref({})

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

const buildSeriesDataset = (data, index) => {
  const seriesDataset = {
    ...dataset.value,
    ...props.datasets[index]
  }

  // Default dataset colors
  const {
    pointHoverBorderColor,
    borderColor,
    backgroundColor
  } = seriesDataset

  // Colors to configure today on graph
  const grey = 'rgba(180,180,180)'
  const transparent = 'rgba(255,255,255,0)'

  // Add customization to data points and line segments
  // according to datapoint position
  return {
    ...seriesDataset,
    pointHoverBorderColor: (ctx) => {
      const isAfterPenultimatePoint =
        ctx.dataIndex >= data.length - 2

      return isAfterPenultimatePoint
        ? grey
        : pointHoverBorderColor
    },
    segment: {
      borderColor: (ctx) => {
        const isLastPoint =
          ctx.p1DataIndex === data.length - 1

        return isLastPoint ? grey : borderColor
      },
      backgroundColor: (ctx) => {
        const isLastPoint =
          ctx.p1DataIndex === data.length - 1

        return isLastPoint ? transparent : backgroundColor
      }
    }
  }
}

// Parse resultSet into data that can be consumed by area-chart component
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

      // Only show bottom and top grid lines by setting
      // the stepSize to be the maxValue
      if (props.isGridMinMax) {
        const maxValue = Math.max(...data.map((d) => d[1]))
        customChartOptions.library.scales.y.ticks.stepSize =
          maxValue
      }

      series.push({
        name: props.datasets[index].name,
        data,
        ...{
          dataset: buildSeriesDataset(data, index)
        }
      })
    })
  }

  // If idealRangeAnnotation is passed
  // Search for hidden datasets to add to the available series
  if (props.idealRangeAnnotation) {
    const hiddenDatasets = props.datasets
      .filter((d) => d.hidden)
      .map((d) => ({
        name: d.name,
        ...{
          dataset: d
        }
      }))

    series.push(...hiddenDatasets)
  }

  return series
}
</script>
