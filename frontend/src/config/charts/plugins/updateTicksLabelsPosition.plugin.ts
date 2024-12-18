export const updateTicksLabelsPositionPlugin = {
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
