import pluralize from 'pluralize';
import { i18n } from '@/i18n';

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
    '#F97316',
  ],
  loading: 'Loading...',
};

const formatTooltipOptions = {
  library: {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => (context.dataset.label ? pluralize(
            i18n(
              `widget.cubejs.tooltip.${context.dataset.label}`,
            ),
            context.dataset.data[context.dataIndex],
            true,
          ) : context.dataset.data[context.dataIndex]),
        },
      },
    },
  },
};

const platformColors = {
  github: '#111827',
  discord: '#8B5CF6',
  slack: '#E94F2E',
  twitter: '#60A5FA',
  devto: '#5EEAD4',
};

const timeXScale = {
  scales: {
    x: {
      time: {
        displayFormats: {
          day: 'MMM DD, YYYY',
          week: 'MMM DD, YYYY',
          month: 'MMM DD, YYYY',
          year: 'MMM DD, YYYY',
        },
        tooltipFormat: 'MMM DD, YYYY',
      },
    },
  },
};

export function chartOptions(widget, resultSet) {
  let chartTypeOptions = {};

  const seriesNames = resultSet
    ? resultSet.seriesNames()
    : [];
  const type = widget.settings.chartType;

  if (type === 'area' || type === 'line') {
    if (seriesNames.length <= 1) {
      chartTypeOptions = {
        library: {
          ...timeXScale,
        },
        computeDataset: (canvas) => {
          const ctx = canvas.getContext('2d');
          const gradient = ctx.createLinearGradient(
            0,
            150,
            0,
            350,
          );
          gradient.addColorStop(0, 'rgba(253,237, 234,1)');
          gradient.addColorStop(1, 'rgba(253,237, 234,0)');
          return { backgroundColor: gradient };
        },
      };
    } else {
      chartTypeOptions = {
        library: {
          ...timeXScale,
        },
        computeDataset: () => ({ backgroundColor: 'transparent' }),
      };
    }
  } else if (type === 'bar') {
    chartTypeOptions = {
      library: {
        ...timeXScale,
      },
    };
  } else if (type === 'pie' || type === 'donut') {
    chartTypeOptions = {
      donut: true,
      legend: 'right',
      library: {
        spacing: 4,
        borderWidth: 0,
        cutout: '65%',
        plugins: {
          tooltip: {
            enabled: true,
            callbacks: {
              label(tooltipItem) {
                return `${tooltipItem.label}: ${tooltipItem.formattedValue}`;
              },
            },
          },
          legend: {
            display: true,
            position: 'right',
            align: 'center',
            labels: {
              usePointStyle: true,
              color: '#000',
              padding: 10,
            },
          },
        },
      },
    };
  }

  // Sort colors by platform
  if (
    widget.settings.query
    && widget.settings.query.dimensions
    && widget.settings.query.dimensions.length
    && widget.settings.query.dimensions.includes(
      'Activities.platform',
    )
    && !(
      ['area', 'line'].includes(type)
      && seriesNames.length <= 1
    )
  ) {
    const platforms = (
      resultSet ? resultSet.tablePivot() : []
    )
      .map((p) => p['Activities.platform'])
      .filter((item, i, ar) => ar.indexOf(item) === i);

    let mappedColors = platforms.map((p) => platformColors[p]);
    const defaultColors = chartTypeOptions.colors || defaultChartOptions.colors;

    const restColors = defaultColors.filter(
      (c) => !mappedColors.includes(c),
    );
    mappedColors = mappedColors.map((c) => {
      if (!c) {
        const firstColor = restColors[0];
        restColors.shift();
        return firstColor;
      }
      return c;
    });

    chartTypeOptions = {
      ...chartTypeOptions,
      colors: [...mappedColors, ...restColors],
    };
  }

  // When there's a dimension, we don't want custom format in tooltips,
  // instead we'll use the default format `dimension: value`
  if (
    widget.settings.query.dimensions
    && widget.settings.query.dimensions.length
  ) {
    return {
      ...defaultChartOptions,
      ...chartTypeOptions,
    };
  }

  const options = {
    ...defaultChartOptions,
    ...chartTypeOptions,
    ...formatTooltipOptions,
  };

  return {
    ...options,
    library: {
      ...options.library,
      ...timeXScale,
      plugins: {
        ...options.library.plugins,
        verticalHoverLine: false,
        backgroundChart: false,
        updateTicksLabelsPosition: false,
        verticalTodayBlock: {
          bottomMargin: 11,
          strokeColor: 'rgb(200,200,200)',
          strokeWidth: 0.5,
          backgroundColor: 'rgb(200,200,200, 0.1)',
        },
      },
    },
  };
}

export function mapWidget(widget, resultSet) {
  const seriesNames = resultSet
    ? resultSet.seriesNames()
    : [];
  let type = widget.settings.chartType;
  if (type === 'line' && seriesNames.length <= 1) {
    type = 'area';
  }
  return {
    ...widget,
    settings: {
      ...widget.settings,
      chartType: type,
    },
  };
}

export default {
  mapWidget,
  chartOptions,
};
