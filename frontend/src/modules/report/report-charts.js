const defaultChartOptions = {
  legend: false,
  curve: false,
  points: false,
  title: undefined,
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

const platformColors = {
  github: '#111827',
  discord: '#8B5CF6',
  slack: '#E94F2E',
  twitter: '#60A5FA',
  devto: '#5EEAD4'
}

export function chartOptions(widget, resultSet) {
  let chartTypeOptions = {}
  const seriesNames = resultSet
    ? resultSet.seriesNames()
    : []
  const type = widget.settings.chartType
  // const dimensionExist = !!(
  //   (widget.settings.query &&
  //     widget.settings.query.dimensions &&
  //     widget.settings.query.dimensions.length) ||
  //   0
  // )

  if (type === 'area' || type === 'line') {
    console.log(seriesNames)
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
        computeDataset: () => {
          return { backgroundColor: 'transparent' }
        }
      }
    }
  } else if (type === 'bar') {
    chartTypeOptions = {}
  } else if (type === 'pie' || type === 'donut') {
    chartTypeOptions = {
      donut: true,
      legend: 'right',
      library: {
        spacing: 4,
        borderWidth: 0,
        cutout: '90%',
        plugins: {
          legend: {
            display: true,
            position: 'right',
            align: 'center',
            labels: {
              usePointStyle: true,
              color: '#000',
              padding: 10
            }
          }
        }
      }
    }
  }

  // Sort colors by platform
  if (
    widget.settings.query &&
    widget.settings.query.dimensions &&
    widget.settings.query.dimensions.length &&
    widget.settings.query.dimensions.includes(
      'Activities.platform'
    ) &&
    !(
      ['area', 'line'].includes(type) &&
      seriesNames.length <= 1
    )
  ) {
    const platforms = (
      resultSet ? resultSet.tablePivot() : []
    ).map((p) => p['Activities.platform'])
    let mappedColors = platforms.map((p) => {
      if (p in platformColors) {
        return platformColors[p]
      }
      return null
    })
    const defaultColors =
      chartTypeOptions.colors || defaultChartOptions.colors
    let restColors = defaultColors.filter(
      (c) => !mappedColors.includes(c)
    )
    mappedColors = mappedColors.map((c) => {
      if (!c) {
        const firstColor = restColors[0]
        restColors.shift()
        return firstColor
      }
      return c
    })
    chartTypeOptions = {
      ...chartTypeOptions,
      colors: [...mappedColors, ...restColors]
    }
  }
  console.log(chartTypeOptions)
  return {
    ...defaultChartOptions,
    ...chartTypeOptions
  }
}

export function mapWidget(widget, resultSet) {
  const seriesNames = resultSet
    ? resultSet.seriesNames()
    : []
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
