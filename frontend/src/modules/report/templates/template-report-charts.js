import { externalTooltipHandler } from '../tooltip'
import moment from 'moment'

const defaultChartOptions = {
  legend: false,
  curve: false,
  points: true,
  title: undefined,
  colors: ['#E94F2E'],
  loading: 'Loading...',
  library: {
    lineTension: 0.3,
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF'
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
          padding: 8
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      tooltip: {
        position: 'nearest',
        enabled: false,
        external: externalTooltipHandler,
        callbacks: {
          label: (context) => {
            return `
              ${
                context.dataset.data[context.dataIndex]
              } ${context.dataset.label.toLowerCase()}
            `
          },
          afterLabel: (context) => {
            if (context.dataIndex === 0) {
              return null
            }

            const currentPoint =
              context.dataset.data[context.dataIndex]
            const previousPoint =
              context.dataset.data[context.dataIndex - 1]
            const difference = currentPoint - previousPoint

            let percDiff

            if (currentPoint === 0 && difference === 0) {
              percDiff = 0
            } else if (currentPoint === 0) {
              percDiff = 100
            } else {
              percDiff = (difference / currentPoint) * 100
            }

            return {
              difference,
              growth: percDiff.toLocaleString('fullwide', {
                maximumFractionDigits: 0
              }),
              previousDate: moment(context.label)
                .subtract(1, context.dataset.granularity)
                .format('MMM DD')
            }
          }
        }
      },
      legend: {
        display: true,
        position: 'bottom',
        align: 'center',
        labels: {
          boxWidth: 16,
          boxHeight: 1,
          fontColor: '#6B7280'
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
          pointHoverBorderWidth: '2'
        }
      }
    }
  }

  return {
    ...defaultChartOptions,
    ...chartTypeOptions
  }
}
