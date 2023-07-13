/* eslint-disable no-underscore-dangle */
/**
 * Draw a block in the chart to identify the current time block
 * Draw a line to start the block,
 * and fill the remaining space until the end of the graph
 */
const verticalTodayBlockPlugin = {
  id: 'verticalTodayBlock',
  afterDraw(chart, _args, options) {
    const chartType = chart.config?._config?.type;
    const xScaleType = chart.scales?.x?.type;

    // Only add vertical lines to line and bar charts
    // Only add vertical lines to time scaled x axis
    if (
      (chartType === 'line' || chartType === 'bar')
      && xScaleType === 'time'
    ) {
      const {
        ctx,
        data,
        chartArea: { top, bottom },
        scales: { x },
      } = chart;

      const penultimatePoint = data.labels[data.labels.length - 2];
      const lastPoint = data.labels[data.labels.length - 1];

      // Logic to add vertical line to the
      // penultimate data point
      ctx.save();

      // Draw vertical line
      ctx.strokeStyle = options.strokeColor;
      ctx.lineWidth = options.strokeWidth;
      ctx.strokeRect(
        x.getPixelForValue(penultimatePoint),
        top,
        0,
        bottom - options.bottomMargin,
      );

      // Logic to add vertical rect
      // between penultimate and last data point
      const rectWidth = x.getPixelForValue(lastPoint)
        - x.getPixelForValue(penultimatePoint);

      // Draw vertical rect
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(
        x.getPixelForValue(penultimatePoint),
        top,
        rectWidth,
        bottom - options.bottomMargin,
      );

      ctx.restore();
    }
  },
};

/**
 * Draw a vertical line in the hovered data points
 */
const verticalHoverLinePlugin = {
  id: 'verticalHoverLine',
  afterDraw: (chart, _args, options) => {
    if (chart.tooltip?._active?.length) {
      const {
        ctx, data, tooltip, chartArea,
      } = chart;
      const activeElement = tooltip._active[0];

      ctx.save();

      ctx.beginPath();
      ctx.moveTo(activeElement.element.x, chartArea.top);
      ctx.lineTo(activeElement.element.x, chartArea.bottom);

      ctx.lineWidth = options.lineWidth;

      // If tooltip is hovered after the last two data points
      // the highlight rect should be greyed out as well
      const isAfterPenultimatePoint = activeElement.index >= data.labels.length - 2;

      ctx.strokeStyle = isAfterPenultimatePoint
        ? options.strokeStyle
        : options.strokeStyleAfterTodayLine;

      ctx.stroke();
      ctx.restore();
    }
  },
};

/**
 * This plugin is responsible for adding a background color to the chart
 * The background will not include the axis, only the chart area
 */
const backgroundChartPlugin = {
  id: 'backgroundChart',
  beforeDraw(chart, _args, options) {
    if (options.backgroundColor) {
      const { ctx, chartArea } = chart;

      ctx.save();
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(
        chartArea.left,
        chartArea.top,
        chartArea.right - chartArea.left,
        chartArea.bottom - chartArea.top,
      );
      ctx.restore();
    }
  },
};

/**
 * Draw labels in a new position without affecting ticks positioning
 */
const updateTicksLabelsPositionPlugin = {
  id: 'updateTicksLabelsPosition',
  beforeDatasetsDraw: (chart, _args, options) => {
    const scale = chart.scales?.[options.scale];

    scale?.ticks?.forEach(
      ({ text, color, fontWeight }, index) => {
        const xOffset = chart.width - options.labelsWidth;
        const yOffset = chart.height
          - options.ranges[index]
          - options.labelsHeight;

        const { ctx } = chart;

        Object.assign(ctx, {
          font: `${fontWeight || 400} 12px Open Sans`,
          fillStyle: color,
        });

        chart.ctx.fillText(text, xOffset, yOffset);
      },
    );
  },
};

export {
  verticalTodayBlockPlugin,
  verticalHoverLinePlugin,
  backgroundChartPlugin,
  updateTicksLabelsPositionPlugin,
};
