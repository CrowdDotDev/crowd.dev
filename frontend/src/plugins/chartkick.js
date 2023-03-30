import { v4 as uuid } from 'uuid';
import Chartkick from 'chartkick';
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
  Filler,
} from 'chart.js';
import 'chartjs-adapter-moment';
import { h } from 'vue';
import annotationPlugin from 'chartjs-plugin-annotation';
import {
  backgroundChartPlugin,
  verticalTodayBlockPlugin,
  verticalHoverLinePlugin,
  updateTicksLabelsPositionPlugin,
} from './chartkick-custom-plugins';
import {
  CustomLogarithmicScale,
} from './chartkick-custom-scales';

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
  verticalTodayBlockPlugin,
  verticalHoverLinePlugin,
  updateTicksLabelsPositionPlugin,
  backgroundChartPlugin,
  annotationPlugin,
  CustomLogarithmicScale,
);

const createComponent = (app, tagName, ChartType) => {
  const chartProps = [
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
    'zeros',
  ];
  app.component(tagName, {
    props: {
      data: {
        type: Array,
        default: () => [],
      },
      id: {
        type: String,
        default: () => uuid(),
      },
      width: {
        type: String,
        default: null,
      },
      height: {
        type: String,
        default: null,
      },
      dataset: {
        type: Object,
        default: undefined,
      },
      library: {
        type: Object,
        default: undefined,
      },
      loading: {
        type: String,
        default: undefined,
      },
      precision: {
        type: String,
        default: undefined,
      },
      round: {
        type: String,
        default: undefined,
      },
      min: {
        type: String,
        default: undefined,
      },
      max: {
        type: String,
        default: undefined,
      },
      xmax: {
        type: String,
        default: undefined,
      },
      xmin: {
        type: String,
        default: undefined,
      },
      legend: {
        type: Boolean,
        default: true,
      },
      ...chartProps.reduce((acc, item) => {
        acc[item] = {
          type: [String, Number, Boolean, Array],
          default: null,
        };
        return acc;
      }, {}),
    },
    data() {
      return {
        chartId: null,
      };
    },
    computed: {
      chartStyle() {
        // hack to watch data and options
        // eslint-disable-next-line no-unused-expressions
        this.data;
        // eslint-disable-next-line no-unused-expressions
        this.chartOptions;

        return {
          height: this.height || '300px',
          lineHeight: this.height || '300px',
          width: this.width || '100%',
          textAlign: 'center',
          color: '#999',
          fontSize: '14px',
          fontFamily:
            "'Lucida Grande', 'Lucida Sans Unicode', Verdana, Arial, Helvetica, sans-serif",
        };
      },
      chartOptions() {
        const options = {};
        const props = Object.keys(this.$props);
        for (let i = 0; i < props.length; i += 1) {
          const prop = props[i];
          if (this[prop] !== undefined) {
            options[prop] = this[prop];
          }
        }
        return options;
      },
    },
    created() {
      this.chartId = this.chartId || this.id;
    },
    mounted() {
      this.updateChart();
    },
    updated() {
      this.updateChart();
    },
    beforeUnmount() {
      if (this.chart) {
        this.chart.destroy();
      }
    },
    methods: {
      updateChart() {
        if (this.data !== null) {
          if (this.chart) {
            this.chart.updateData(
              this.data,
              this.chartOptions,
            );
          } else {
            this.chart = new ChartType(
              this.chartId,
              this.data,
              this.chartOptions,
            );
          }
        } else if (this.chart) {
          this.chart.destroy();
          this.chart = null;
          this.$el.innerText = 'Loading...';
        }
      },
    },
    render() {
      // check if undefined so works with empty string
      const loading = this.chartOptions.loading !== undefined
        ? this.chartOptions.loading
        : 'Loading...';

      // h() accepts VNodes,
      // but limit to string since it may be used by Chartkick.js
      if (typeof loading !== 'string') {
        throw new Error('loading must be a string');
      }

      return h(
        'div',
        {
          id: this.chartId,
          style: this.chartStyle,
        },
        [loading],
      );
    },
  });
};

Chartkick.install = (app) => {
  Chartkick.addAdapter(Chart);
  createComponent(app, 'line-chart', Chartkick.LineChart);
  createComponent(app, 'pie-chart', Chartkick.PieChart);
  createComponent(
    app,
    'column-chart',
    Chartkick.ColumnChart,
  );
  createComponent(app, 'bar-chart', Chartkick.BarChart);
  createComponent(app, 'area-chart', Chartkick.AreaChart);
  createComponent(
    app,
    'scatter-chart',
    Chartkick.ScatterChart,
  );
  createComponent(app, 'geo-chart', Chartkick.GeoChart);
  createComponent(app, 'timeline', Chartkick.Timeline);
};

export default Chartkick;
