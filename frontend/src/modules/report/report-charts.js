const defaultChartOptions = {
  legend: false,
  curve: false,
  points: false,
  colors: ['#E94F2E'],
  loading: 'Loading...'
}

export function chartOptions(widget) {
  let chartTypeOptions = {}
  const type = widget.settings.chartType
  if (type === 'area' || type === 'line') {
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
        cutoutPercentage: 20
      },
      donut: true
    }
  }
  return {
    ...defaultChartOptions,
    ...chartTypeOptions
  }
}

export function mapWidget(widget) {
  let type = widget.settings.chartType
  if (type === 'line') {
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
