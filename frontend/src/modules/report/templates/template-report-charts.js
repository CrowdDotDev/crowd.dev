import {
  parseTooltipTitle,
  formatTooltipTitle,
  parseTooltipBody,
} from '@/utils/reports';
import { externalTooltipHandler } from '../tooltip';

const defaultChartOptions = (config) => ({
  legend: false,
  curve: true,
  points: true,
  title: undefined,
  colors: ['#E94F2E'],
  loading: 'Loading...',
  empty: 'Loading...',
  library: {
    layout: {
      padding: {
        top: 20,
      },
    },
    lineTension: 0.25,
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            day: 'MMM DD, YYYY',
          },
        },
        ticks: {
          display: config.xTicks,
          color: '#9CA3AF',
          font: {
            family: 'Inter',
            size: 10,
          },
          callback: config.xTicksCallback,
        },
        grid: {
          display: config.xLines,
        },
      },
      y: {
        grid: {
          display: config.yLines,
          drawBorder: false,
          color: '#D1D5DB',
          borderDash: [4, 6],
          drawTicks: false,
        },
        ticks: {
          display: config.yTicks,
          color: '#9CA3AF',
          padding: 8,
          font: {
            family: 'Inter',
            size: 10,
          },
          callback: config.yTicksCallback,
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      verticalTodayLine: {
        bottomMargin: 14,
      },
      tooltip: {
        position: 'nearest',
        enabled: false,
        external: externalTooltipHandler,
        callbacks: {
          title: parseTooltipTitle,
          label: formatTooltipTitle,
          afterLabel: parseTooltipBody,
          footer: (context) => context[0].dataset.tooltipBtn,
        },
      },
      legend: config.legend && {
        display: true,
        position: 'bottom',
        align: 'center',
        onClick: (_click, legendItem, legend) => {
          const datasets = legend.legendItems.map(
            (dataset) => dataset.text,
          );

          const index = datasets.indexOf(legendItem.text);

          if (legend.chart.isDatasetVisible(index)) {
            legend.chart.hide(index);
          } else {
            legend.chart.show(index);
          }
        },
        labels: {
          font: {
            family: 'Inter',
            size: 12,
          },
          usePointStyle: true,
          generateLabels: (chart) => {
            const visibility = [];

            chart.data.datasets.forEach((_, i) => {
              if (chart.isDatasetVisible(i)) {
                visibility.push(false);
              } else {
                visibility.push(true);
              }
            });

            return chart.data.datasets.map(
              (dataset, index) => ({
                text: dataset.label,
                fillStyle: dataset.backgroundColor,
                strokeStyle: dataset.borderColor,
                lineDash: dataset.borderDash,
                fontColor: '#6B7280',
                pointStyle: 'line',
                hidden: visibility[index],
                lineWidth: 2,
              }),
            );
          },
        },
      },
    },
  },
});

const defaultChartConfig = {
  legend: true,
  xTicks: true,
  xLines: false,
  xTicksCallback: undefined,
  yTicks: true,
  yLines: true,
  yTicksCallback: undefined,
  gradient: {
    x0: 0,
    y0: 150,
    x1: 0,
    y1: 350,
    stops: [
      {
        offset: 0,
        color: 'rgba(233, 79, 46, 0.05)',
      },
      {
        offset: 1,
        color: 'rgba(233, 79, 46, 0)',
      },
    ],
  },
};

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
        pointHoverBorderColor: '#E94F2E',
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
