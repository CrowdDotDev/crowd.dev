import { Chart } from 'chart.js';

import { dashboardAreaChart } from './configs/dashboard.area.chart';

import { verticalTodayBlockPlugin } from './plugins/verticalTodayBlock.plugin';
import { verticalHoverLinePlugin } from './plugins/verticalHoverLine.plugin';

export type ChartConfig = (ctx: any, data: any, params: any) => any;

export const lfxCharts: Record<string, ChartConfig> = {
  dashboardAreaChart,
};

const lfxChartPlugins: Record<String, any> = {
  verticalTodayBlockPlugin,
  verticalHoverLinePlugin,
};

Chart.register(lfxChartPlugins);
