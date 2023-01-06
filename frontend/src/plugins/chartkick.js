import { v4 as uuid } from 'uuid'
import Chartkick from 'chartkick'
import {
  Chart,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  LineController,
  ArcElement,
  PieController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Legend,
  Title,
  Tooltip,
  SubTitle,
  Filler
} from 'chart.js'
import 'chartjs-adapter-moment'
import { h } from 'vue'

/**
 * This plugin is responsible for doing a couple of different things:
 * - Initializing chart.js (the package that we're using to render charts)
 * - Initializing chartkick (a package that we're using to easily create customized charts based on chart.js)
 * - Creating global components like <line-chart> or <pie-chart> to enhance developer experience and code quality
 */

const tooltipAnnotationLine = {
  id: 'tooltipAnnotationLine',
  beforeDraw: (chart) => {
    if (chart.tooltip._active?.length) {
      const ctx = chart.ctx

      ctx.save()

      ctx.beginPath()
      ctx.moveTo(
        chart.tooltip._active[0].element.x,
        chart.chartArea.top
      )
      ctx.lineTo(
        chart.tooltip._active[0].element.x,
        chart.chartArea.bottom
      )
      ctx.lineWidth = 32
      ctx.strokeStyle = 'rgba(233,79,46, 0.05)'
      ctx.stroke()
      ctx.restore()
    }
  }
}

Chart.register(
  LineElement,
  BarElement,
  PointElement,
  BarController,
  LineController,
  ArcElement,
  PieController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Legend,
  Title,
  Tooltip,
  SubTitle,
  Filler,
  tooltipAnnotationLine
)

let createComponent = function (app, tagName, chartType) {
  let chartProps = [
    'bytes',
    'code',
    'colors',
    'curve',
    'decimal',
    'discrete',
    'donut',
    'download',
    'empty',
    'label',
    'messages',
    'points',
    'prefix',
    'refresh',
    'stacked',
    'suffix',
    'thousands',
    'title',
    'xtitle',
    'ytitle',
    'zeros'
  ]
  app.component(tagName, {
    props: {
      data: {
        type: Array,
        default: () => []
      },
      id: {
        type: String,
        default: () => {
          return uuid()
        }
      },
      width: {
        type: String,
        default: null
      },
      height: {
        type: String,
        default: null
      },
      dataset: {
        type: Object,
        default: undefined
      },
      library: {
        type: Object,
        default: undefined
      },
      loading: {
        type: String,
        default: undefined
      },
      precision: {
        type: String,
        default: undefined
      },
      round: {
        type: String,
        default: undefined
      },
      min: {
        type: String,
        default: undefined
      },
      max: {
        type: String,
        default: undefined
      },
      xmax: {
        type: String,
        default: undefined
      },
      xmin: {
        type: String,
        default: undefined
      },
      legend: {
        type: Boolean,
        default: true
      },
      ...chartProps.reduce((acc, item) => {
        acc[item] = {
          type: [String, Number, Boolean, Array],
          default: null
        }
        return acc
      }, {})
    },
    data() {
      return {
        chartId: null
      }
    },
    computed: {
      chartStyle: function () {
        // hack to watch data and options
        this.data
        this.chartOptions

        return {
          height: this.height || '300px',
          lineHeight: this.height || '300px',
          width: this.width || '100%',
          textAlign: 'center',
          color: '#999',
          fontSize: '14px',
          fontFamily:
            "'Lucida Grande', 'Lucida Sans Unicode', Verdana, Arial, Helvetica, sans-serif"
        }
      },
      chartOptions: function () {
        let options = {}
        let props = Object.keys(this.$props)
        for (let i = 0; i < props.length; i++) {
          let prop = props[i]
          if (this[prop] !== undefined) {
            options[prop] = this[prop]
          }
        }
        return options
      }
    },
    created: function () {
      this.chartId = this.chartId || this.id
    },
    mounted: function () {
      this.updateChart()
    },
    updated: function () {
      this.updateChart()
    },
    beforeUnmount: function () {
      if (this.chart) {
        this.chart.destroy()
      }
    },
    methods: {
      updateChart: function () {
        if (this.data !== null) {
          if (this.chart) {
            this.chart.updateData(
              this.data,
              this.chartOptions
            )
          } else {
            this.chart = new chartType(
              this.chartId,
              this.data,
              this.chartOptions
            )
          }
        } else if (this.chart) {
          this.chart.destroy()
          this.chart = null
          this.$el.innerText = 'Loading...'
        }
      }
    },
    render: function () {
      // check if undefined so works with empty string
      let loading =
        this.chartOptions.loading !== undefined
          ? this.chartOptions.loading
          : 'Loading...'

      // h() accepts VNodes,
      // but limit to string since it may be used by Chartkick.js
      if (typeof loading !== 'string') {
        throw new Error('loading must be a string')
      }

      return h(
        'div',
        {
          id: this.chartId,
          style: this.chartStyle
        },
        [loading]
      )
    }
  })
}

Chartkick.install = function (app) {
  Chartkick.addAdapter(Chart)
  createComponent(app, 'line-chart', Chartkick.LineChart)
  createComponent(app, 'pie-chart', Chartkick.PieChart)
  createComponent(
    app,
    'column-chart',
    Chartkick.ColumnChart
  )
  createComponent(app, 'bar-chart', Chartkick.BarChart)
  createComponent(app, 'area-chart', Chartkick.AreaChart)
  createComponent(
    app,
    'scatter-chart',
    Chartkick.ScatterChart
  )
  createComponent(app, 'geo-chart', Chartkick.GeoChart)
  createComponent(app, 'timeline', Chartkick.Timeline)
}

export default Chartkick
