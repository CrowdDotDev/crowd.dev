export const verticalHoverLinePlugin = {
  id: 'verticalHoverLine',
  afterDraw: (chart, _args, options) => {
    // eslint-disable-next-line no-underscore-dangle
    if (chart.tooltip?._active?.length) {
      const {
        ctx, data, tooltip, chartArea,
      } = chart;
      // eslint-disable-next-line no-underscore-dangle
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
