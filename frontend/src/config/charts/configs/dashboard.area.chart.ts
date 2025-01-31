import dayjs from 'dayjs';
import { formatTooltipTitle, parseTooltipBody, parseTooltipTitle } from '@/utils/reports';
import { ChartConfig } from '@/config/charts';
import { externalTooltipHandler } from '@/config/charts/helpers/tooltip';

interface DashboardAreaChartData {
  value: number,
  label: string;
}
interface DashboardAreaChartParams {
  label: string;
}

export const dashboardAreaChart: ChartConfig = (ctx: any, data: DashboardAreaChartData[], params: DashboardAreaChartParams): any => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 100);
  gradient.addColorStop(0.38, 'rgba(0, 148, 255, 0.10)');
  gradient.addColorStop(1, 'rgba(0, 148, 255, 0.0)');

  const chartData = data.map((item) => item.value);
  const labels = data.map((item) => new Date(item.label));

  const colorGray = '#b4b4b4';
  const colorBlue = '#003778';
  const colorWhite = '#fff';
  const colorTransparent = 'transparent';

  return {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: params.label,
        data: chartData,
        borderColor: colorBlue,
        tension: 0.25,
        showLine: true,
        fill: true,
        borderWidth: 2,
        backgroundColor: gradient,
        pointRadius: 5,
        pointBorderColor: 'transparent',
        pointBackgroundColor: 'transparent',
        pointHoverBorderColor: (ctx: any) => {
          const isAfterPenultimatePoint = ctx.dataIndex >= data.length - 2;
          return isAfterPenultimatePoint
            ? colorGray
            : colorBlue;
        },
        segment: {
          borderColor: (ctx: any) => {
            const isLastPoint = ctx.p1DataIndex === data.length - 1;

            return isLastPoint ? colorGray : colorBlue;
          },
          backgroundColor: (ctx: any) => {
            const isLastPoint = ctx.p1DataIndex === data.length - 1;

            return isLastPoint ? colorTransparent : gradient;
          },
        },
        pointHoverBackgroundColor: colorWhite,
        pointHoverBorderWidth: 2,
        spanGaps: true,
        clip: false,
      }],
    },
    options: {
      indexAxis: 'x',
      layout: {
        padding: {
          top: 20,
        },
      },
      lineTension: 0.25,
      scales: {
        y: {
          type: 'linear',
          beginAtZero: true,
          position: 'left',
          ticks: {
            display: false,
          },
          grid: {
            drawBorder: false,
            display: false,
          },
          gridLines: {
            drawOnChartArea: true,
          },
          y1: {
            display: false,
          },
        },
        x: {
          type: 'time',
          time: {
            displayFormats: {
              day: 'MMM DD, YYYY',
              week: 'MMM DD, YYYY',
              month: 'MMM DD, YYYY',
              year: 'MMM DD, YYYY',
            },
            tooltipFormat: 'MM/DD/YYYY',
          },
          ticks: {
            display: true,
            maxTicksLimit: 3,
            maxRotation: 0,
            color: '#003778',
            font: {
              family: 'Open Sans',
              size: 10,
            },
            callback: (label: string) => dayjs(label).format('MMM DD'),
          },
          grid: {
            display: false,
          },
        },
      },
      clip: false,
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: false,
        backgroundChart: false,
        updateTicksLabelsPosition: false,
        verticalHoverLine: {
          lineWidth: 32,
          strokeStyle: 'rgba(100,100,100, 0.05)',
          strokeStyleAfterTodayLine: 'rgba(24,96,184, 0.05)',
        },
        verticalTodayBlock: {
          bottomMargin: 11,
          strokeColor: '#E5E7EB',
          strokeWidth: 0.5,
          backgroundColor: 'rgba(229, 231, 235, 0.25)',
        },
        tooltip: {
          position: 'nearest',
          enabled: false,
          external: externalTooltipHandler,
          callbacks: {
            title: parseTooltipTitle,
            label: formatTooltipTitle,
            afterLabel: parseTooltipBody,
          },
        },
      },
    },
  };
};
