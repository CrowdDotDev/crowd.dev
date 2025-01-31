import dayjs from 'dayjs';

export const dashboardChartOptions = {
  legend: false,
  yTicks: false,
  yLines: false,
  xTicksCallback: (label) => dayjs(label).format('MMM DD'),
  gradient: {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 100,
    stops: [
      {
        offset: 0.38,
        color: 'rgba(0, 148, 255, 0.10)',
      },
      {
        offset: 1,
        color: 'rgba(0, 148, 255, 0.00)',
      },
    ],
  },
  legendPlugin: false,
  xMaxTicksLimit: 3,
  xMaxRotation: 0,
};
