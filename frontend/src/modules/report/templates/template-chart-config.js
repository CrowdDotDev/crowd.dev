import { defaultChartConfig } from './template-chart-default-config';

const defaultChartOptions = (config) => ({
  legend: false,
  curve: true,
  points: true,
  title: undefined,
  colors: ['#003778'],
  loading: 'Loading...',
  empty: 'Loading...',
  library: {
    indexAxis: config.indexAxis,
    layout: {
      padding: {
        top: 20,
      },
    },
    lineTension: 0.25,
    scales: {
      x: {
        type: config.xType,
        time: config.xType === 'time' && {
          displayFormats: {
            day: 'MMM DD, YYYY',
          },
        },
        ticks: {
          display: config.xTicks,
          color: '#003778',
          font: {
            family: 'Open Sans',
            size: 10,
          },
          callback: config.xTicksCallback,
        },
        grid: {
          display: config.xLines,
        },
      },
      y: {
        type: config.yType,
        beginAtZero: true,
        position: config.yPosition,
        min: config.yMin,
        max: config.yMax,
        suggestedMax: config.ySuggestedMax,
        afterBuildTicks: config.yAfterBuildTicks,
        grid: {
          display: config.yLines,
          drawOnChartArea: config.yLinesDrawOnChartArea,
          drawBorder: false,
          color: '#D1D5DB',
          borderDash: [4, 6],
          drawTicks: false,
        },
        gridLines: {
          drawOnChartArea: config.yLinesDrawOnChartArea,
        },
        ticks: {
          display: config.yTicks,
          autoSkip: config.yTicksAutoSkip,
          color: '#9CA3AF',
          padding: 8,
          font: {
            family: 'Open Sans',
            size: 10,
          },
          ...(config.yMaxTicksLimit && { maxTicksLimit: config.yMaxTicksLimit }),
          stepSize: config.yStepSize,
          callback: config.yTicksCallback,
        },
      },
      y1: config.y1Scale,
    },
    clip: config.clip,
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      backgroundChart: config.backgroundChartPlugin,
      updateTicksLabelsPosition:
        config.updateTicksLabelsPositionPlugin,
      annotation: config.annotationPlugin,
      verticalHoverLine: config.verticalHoverLinePlugin,
      verticalTodayBlock: config.verticalTodayBlockPlugin,
      tooltip: config.tooltipPlugin,
      legend: config.legendPlugin,
    },
  },
});

export function chartOptions(type, config) {
  const chartConfig = {
    ...defaultChartConfig,
    ...config,
  };

  let chartTypeOptions = {};

  if (type === 'area') {
    const computeDataset = (conf) => (canvas) => {
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(
        conf.gradient.x0,
        conf.gradient.y0,
        conf.gradient.x1,
        conf.gradient.y1,
      );
      conf.gradient.stops.forEach((stop) => {
        gradient.addColorStop(stop.offset, stop.color);
      });

      return {
        backgroundColor: gradient,
        pointRadius: 5,
        pointBorderColor: 'transparent',
        pointBackgroundColor: 'transparent',
        pointHoverBorderColor: '#003778',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderWidth: '2',
        spanGaps: true,
      };
    };

    chartTypeOptions = {
      computeDataset: computeDataset(chartConfig),
    };
  }

  return {
    ...defaultChartOptions(chartConfig),
    ...chartTypeOptions,
  };
}
