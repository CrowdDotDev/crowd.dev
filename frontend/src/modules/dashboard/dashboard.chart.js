import moment from 'moment';

export const dashboardChartOptions = {
  legend: false,
  yTicks: false,
  yLines: false,
  xTicksCallback: (label) => moment(label).format('MMM DD'),
  gradient: {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 100,
    stops: [
      {
        offset: 0.38,
        color: 'rgba(253,237, 234,1)',
      },
      {
        offset: 1,
        color: 'rgba(253,237, 234,0)',
      },
    ],
  },
  legendPlugin: false,
  xMaxTicksLimit: 3,
  xMaxRotation: 0,
};
