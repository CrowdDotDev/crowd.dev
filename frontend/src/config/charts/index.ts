import {
  Chart, Filler, LinearScale,
  LineController,
  LineElement, PointElement, TimeScale, Tooltip,
} from 'chart.js';

import { dashboardAreaChart } from './configs/dashboard.area.chart';

import { verticalTodayBlockPlugin } from './plugins/verticalTodayBlock.plugin';
import { verticalHoverLinePlugin } from './plugins/verticalHoverLine.plugin';

export type ChartConfig = (ctx: any, data: any, params: any) => any;

export const lfxCharts: Record<string, ChartConfig> = {
  dashboardAreaChart,
};

const lfxChartPlugins: Record<string, any> = {
  verticalTodayBlockPlugin,
  verticalHoverLinePlugin,
};

const chartjsPlugins: Record<string, any> = {
  LineElement,
  PointElement,
  LineController,
  LinearScale,
  TimeScale,
  Tooltip,
  Filler,
};

Chart.register(
  {
    ...chartjsPlugins,
    ...lfxChartPlugins,
  },
);
