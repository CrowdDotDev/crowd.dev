export const backgroundChartPlugin = {
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
