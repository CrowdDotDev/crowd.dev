import { externalTooltipHandler } from '../tooltip'
import {
  parseTooltipTitle,
  formatTooltipTitle,
  parseTooltipBody
} from '@/utils/reports'

const defaultChartOptions = {
  legend: false,
  curve: false,
  points: true,
  title: undefined,
  colors: ['#E94F2E'],
  loading: 'Loading...',
  library: {
    lineTension: 0.25,
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            day: 'MMM DD, YYYY'
          }
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            family: 'Inter',
            size: 10
          }
        }
      },
      y: {
        grid: {
          drawBorder: false,
          color: '#D1D5DB',
          borderDash: [4, 6],
          drawTicks: false
        },
        ticks: {
          color: '#9CA3AF',
          padding: 8,
          font: {
            family: 'Inter',
            size: 10
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      verticalTodayLine: {
        bottomMargin: 14
      },
      tooltip: {
        position: 'nearest',
        enabled: false,
        external: externalTooltipHandler,
        callbacks: {
          title: parseTooltipTitle,
          label: formatTooltipTitle,
          afterLabel: parseTooltipBody
        }
      },
      legend: {
        display: true,
        position: 'bottom',
        align: 'center',
        onClick: (_click, legendItem, legend) => {
          const datasets = legend.legendItems.map(
            (dataset) => dataset.text
          )

          const index = datasets.indexOf(legendItem.text)

          if (legend.chart.isDatasetVisible(index)) {
            legend.chart.hide(index)
          } else {
            legend.chart.show(index)
          }
        },
        labels: {
          font: {
            family: 'Inter',
            size: 12
          },
          usePointStyle: true,
          generateLabels: (chart) => {
            let visibility = []

            chart.data.datasets.forEach((_, i) => {
              if (chart.isDatasetVisible(i)) {
                visibility.push(false)
              } else {
                visibility.push(true)
              }
            })

            return chart.data.datasets.map(
              (dataset, index) => ({
                text: dataset.label,
                fillStyle: dataset.backgroundColor,
                strokeStyle: dataset.borderColor,
                lineDash: dataset.borderDash,
                fontColor: '#6B7280',
                pointStyle: 'line',
                hidden: visibility[index],
                lineWidth: 2
              })
            )
          }
        }
      }
    }
  }
}

export function chartOptions(type) {
  let chartTypeOptions = {}

  if (type === 'area') {
    chartTypeOptions = {
      computeDataset: (canvas) => {
        const ctx = canvas.getContext('2d')
        const gradient = ctx.createLinearGradient(
          0,
          150,
          0,
          350
        )
        gradient.addColorStop(0, 'rgba(233, 79, 46, 0.05)')
        gradient.addColorStop(1, 'rgba(233, 79, 46, 0)')

        return {
          backgroundColor: gradient,
          pointRadius: 5,
          pointBorderColor: 'transparent',
          pointBackgroundColor: 'transparent',
          pointHoverBorderColor: '#E94F2E',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderWidth: '2',
          spanGaps: true
        }
      }
    }
  }

  return {
    ...defaultChartOptions,
    ...chartTypeOptions
  }
}
