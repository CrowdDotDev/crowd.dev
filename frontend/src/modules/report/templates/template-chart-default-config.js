import {
  parseTooltipTitle,
  formatTooltipTitle,
  parseTooltipBody,
} from '@/utils/reports';
import { externalTooltipHandler } from '../tooltip';

export const defaultChartConfig = {
  legend: true,
  clip: false,
  xTicks: true,
  xLines: false,
  xTicksCallback: undefined,
  xType: 'time',
  yTicks: true,
  yTicksAutoSkip: false,
  yAfterBuildTicks: null,
  yLines: true,
  yLinesDrawOnChartArea: true,
  yTicksCallback: undefined,
  yType: 'linear',
  yPosition: 'left',
  yMin: null,
  yMax: null,
  ySuggestedMax: null,
  yStepSize: null,
  yMaxTicksLimit: null,
  indexAxis: 'x',
  y1Scale: {
    display: false,
  },
  gradient: {
    x0: 0,
    y0: 150,
    x1: 0,
    y1: 300,
    stops: [
      {
        offset: 0,
        color: 'rgba(0, 148, 255, 0.10)',
      },
      {
        offset: 1,
        color: 'rgba(0, 148, 255, 0.00)',
      },
    ],
  },
  backgroundChartPlugin: false,
  updateTicksLabelsPositionPlugin: false,
  annotationPlugin: false,
  verticalHoverLinePlugin: {
    lineWidth: 32,
    strokeStyle: 'rgba(100,100,100, 0.05)',
    strokeStyleAfterTodayLine: 'rgba(24,96,184, 0.05)',
  },
  verticalTodayBlockPlugin: {
    bottomMargin: 11,
    strokeColor: '#E5E7EB',
    strokeWidth: 0.5,
    backgroundColor: 'rgba(229, 231, 235, 0.25)',
  },
  tooltipPlugin: {
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
  legendPlugin: {
    display: true,
    position: 'bottom',
    align: 'center',
    onClick: (_click, legendItem, legend) => {
      if (legendItem.preventClick) {
        return;
      }

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
        family: 'Open Sans',
        size: 12,
      },
      usePointStyle: true,
      generateLabels: (chart) => {
        const visibility = [];

        chart.data.datasets.forEach((d, i) => {
          if (chart.isDatasetVisible(i)) {
            visibility.push(false);
          } else {
            visibility.push(true);
          }
        });

        // Show legends for datasets that do not have "showLegend" explicitly set to false
        // Prevent to click on legends to show/hide datasets if dataset is hidden
        return chart.data.datasets
          .filter((d) => !(d.showLegend === false))
          .map((dataset, index) => ({
            text: dataset.label,
            fillStyle: dataset.backgroundColor,
            strokeStyle: dataset.borderColor,
            lineDash: dataset.borderDash,
            fontColor: '#6B7280',
            pointStyle: dataset.pointStyle || 'line',
            hidden: visibility[index],
            preventClick: dataset.hidden === true,
            lineWidth: 2,
          }));
      },
    },
  },
};
