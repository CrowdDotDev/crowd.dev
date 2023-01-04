import { externalTooltipHandler } from './tooltip'

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
        external: externalTooltipHandler
      },
      legend: {
        display: true,
        position: 'bottom',
        align: 'center',
        labels: {
          boxHeight: 0,
          boxWidth: 16,
          fontColor: '#6B7280'
        }
      }
    }
  }
}

export function chartOptions(widget) {
  let chartTypeOptions = {}
  const type = widget.settings.chartType

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
        gradient.addColorStop(0, 'rgba(253,237, 234,1)')
        gradient.addColorStop(1, 'rgba(253,237, 234,0)')

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
