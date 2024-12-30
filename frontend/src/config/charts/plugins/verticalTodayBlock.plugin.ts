export const verticalTodayBlockPlugin = {
  id: 'verticalTodayBlock',
  afterDraw(chart, _args, options) {
    // eslint-disable-next-line no-underscore-dangle
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
