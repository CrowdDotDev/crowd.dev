const defaultChartOptions = {
  legend: false,
  curve: false,
  points: false,
  colors: [
    '#E94F2E',
    '#111827',
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#06B6D4',
    '#F97316'
  ],
  loading: 'Loading...'
}

export function chartOptions(widget, resultSet) {
  let chartTypeOptions = {}
  const seriesNames = resultSet.seriesNames()
  const type = widget.settings.chartType
  console.log(seriesNames.length)
  if (type === 'area' || type === 'line') {
    if (seriesNames.length <= 1) {
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
          return { backgroundColor: gradient }
        }
      }
    } else {
      chartTypeOptions = {
        library: { backgroundColor: '#eee' }
      }
    }
  } else if (type === 'bar') {
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
        // ctx.fillStyle = gradient
        // ctx.fillRect(20, 20, 150, 100)
        return { backgroundColor: gradient }
      }
    }
  } else if (type === 'pie') {
    chartTypeOptions = {
      library: {
        cutoutPercentage: 10
      },
      donut: true
    }
  }
  return {
    ...defaultChartOptions,
    ...chartTypeOptions
  }
}

export function mapWidget(widget, resultSet) {
  const seriesNames = resultSet.seriesNames()
  let type = widget.settings.chartType
  if (type === 'line' && seriesNames.length <= 1) {
    type = 'area'
  }
  return {
    ...widget,
    settings: {
      ...widget.settings,
      chartType: type
    }
  }
}
