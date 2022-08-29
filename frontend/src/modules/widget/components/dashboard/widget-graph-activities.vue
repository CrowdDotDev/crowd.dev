<template>
  <app-widget-cube-renderer
    :widget="widget"
    :show-subtitle="false"
    :chart-options="{
      library: {
        elements: {
          point: {
            radius: 0,
            hoverRadius: 5
          }
        }
      },
      legend: false,
      min: null
    }"
  ></app-widget-cube-renderer>
</template>

<script>
import WidgetCubeRenderer from '../cube/widget-cube-renderer'

export default {
  name: 'AppWidgetGraphActivities',
  components: {
    'app-widget-cube-renderer': WidgetCubeRenderer
  },
  props: ['date'],
  computed: {
    widget() {
      return {
        title: 'New Activities Through Time',
        settings: {
          chartType: 'bar',
          query: {
            measures: ['Activities.count'],
            timeDimensions: [
              {
                dimension: 'Activities.date',
                granularity: 'day',
                dateRange: this.date
              }
            ],
            limit: 10000,
            order: {
              'Activities.date': 'asc'
            }
          }
        }
      }
    }
  }
}
</script>
