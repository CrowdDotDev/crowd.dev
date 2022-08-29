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
  props: {
    date: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    widget() {
      return {
        title: 'New Members Through Time',
        settings: {
          chartType: 'bar',
          query: {
            measures: ['Members.count'],
            timeDimensions: [
              {
                dimension: 'Members.joinedAt',
                granularity: 'day',
                dateRange: this.date
              }
            ],
            limit: 10000,
            order: {
              'Members.joinedAt': 'asc'
            }
          }
        }
      }
    }
  }
}
</script>
