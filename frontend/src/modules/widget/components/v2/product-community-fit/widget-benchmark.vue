<template>
  <div class="bg-white pt-5 rounded-lg shadow">
    <query-renderer
      v-if="cubejsApi"
      :cubejs-api="cubejsApi"
      :query="query"
    >
      <template #default="{ resultSet, loading, error }">
        <div class="px-6">
          <div
            class="flex grow justify-between items-center pb-5 border-b border-gray-100"
            :class="{ 'mb-8': !loading && !error }"
          >
            <div class="flex gap-1">
              <!-- TODO: Add description when available -->
              <app-widget-title title="Benchmark" />
            </div>

            <app-widget-period
              :template="
                PRODUCT_COMMUNITY_FIT_REPORT.nameAsId
              "
              widget="Benchmark"
              :period="period"
              :granularity="granularity"
              :options="MONTHLY_WIDGET_PERIOD_OPTIONS"
              module="reports"
              @on-update="onUpdatePeriod"
            />
          </div>

          <!-- Loading -->
          <app-widget-loading v-if="loading" />

          <!-- Error -->
          <app-widget-error v-else-if="error" />

          <!-- Widget Chart -->

          <div v-else class="flex pb-8 gap-14">
            <div class="basis-1/4">
              <app-widget-average-kpi
                :result="average"
                description="Avg. monthly contributors"
              />
            </div>
            <app-widget-bar
              :datasets="datasets"
              :result-set="resultSet"
              :chart-options="benchmarkChartOptions"
              :granularity="granularity.value"
              :show-as-average="true"
              @on-average-calculation="onAverageCalculation"
            />
          </div>
        </div>
      </template>
    </query-renderer>
    <app-widget-insight>
      <template #description>
        <span>Considering the contribution history of over
          150,000 open-source repositories, we come to the
          conclusion that you had
          <span class="font-medium">Great Product-Community fit</span>{{
            period.label === 'All time'
              ? ' since the beginning of your community.'
              : ` during the past ${pluralize(
                period.granularity,
                period.value,
                true,
              )}.`
          }}</span>
      </template>
    </app-widget-insight>
  </div>
</template>

<script setup>
import { computed, ref, defineProps } from 'vue';
import pluralize from 'pluralize';
import { QueryRenderer } from '@cubejs-client/vue3';
import AppWidgetTitle from '@/modules/widget/components/v2/shared/widget-title.vue';
import AppWidgetPeriod from '@/modules/widget/components/v2/shared/widget-period.vue';
import AppWidgetInsight from '@/modules/widget/components/v2/shared/widget-insight.vue';
import AppWidgetAverageKpi from '@/modules/widget/components/v2/shared/widget-average-kpi.vue';
import AppWidgetBar from '@/modules/widget/components/v2/shared/widget-bar.vue';
import AppWidgetLoading from '@/modules/widget/components/v2/shared/widget-loading.vue';
import AppWidgetError from '@/modules/widget/components/v2/shared/widget-error.vue';
import {
  MONTHLY_GRANULARITY_FILTER,
  SIX_MONTHS_PERIOD_FILTER,
  MONTHLY_WIDGET_PERIOD_OPTIONS,
  ALL_TIME_PERIOD_FILTER,
  YEARLY_GRANULARITY_FILTER,
} from '@/modules/widget/widget-constants';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { TOTAL_MONTHLY_ACTIVE_CONTRIBUTORS } from '@/modules/widget/widget-queries';
import { chartOptions } from '@/modules/report/templates/template-report-charts';
import { PRODUCT_COMMUNITY_FIT_REPORT } from '@/modules/report/templates/template-reports';

const benchmarkChartOptions = chartOptions('bar', {
  xTicks: false,
  xLines: false,
  xType: 'category',
  yLines: false,
  yLinesDrawOnChartArea: false,
  yTicksAutoSkip: false,
  yMin: 0,
  yMax: 250,
  // eslint-disable-next-line no-return-assign, no-param-reassign
  yAfterBuildTicks: (axis) => (axis.ticks = [0, 20, 50, 100, 200].map((v) => ({
    value: v,
  }))),
  y1Scale: {
    type: 'linear',
    position: 'right',
    min: 0,
    max: 250,
    grid: {
      display: true,
      drawBorder: false,
      color: '#9CA3AF',
      borderDash: [4, 6],
      drawOnChartArea: true,
      drawTicks: false,
    },
    ticks: {
      display: false,
      padding: 8,
      font: {
        family: 'Inter',
        size: 12,
      },
    },
    // eslint-disable-next-line no-return-assign, no-param-reassign
    afterBuildTicks: (axis) => (axis.ticks = [0, 20, 50, 100, 200].map((v) => ({
      value: v,
    }))),
    afterTickToLabelConversion: (axis) => {
      const labels = [
        { text: '' },
        {
          text: 'Early signals of Product-Community fit (20-50)',
          color: '#9CA3AF',
        },
        {
          text: 'Strong emerging signals of Product-Community fit (51-100)',
          color: '#9CA3AF',
        },
        {
          text: 'Great Product-Community fit (101-200)',
          color: '#111827',
          fontWeight: 500,
        },
        {
          text: 'Scale beyond Product-Community fit (200+)',
          color: '#9CA3AF',
        },
      ];

      // eslint-disable-next-line no-return-assign, no-param-reassign
      axis.ticks = axis.ticks.map(({ value }, i) => ({
        value,
        ...labels[i],
      }));
    },
    afterFit: (scaleInstance) => {
      // eslint-disable-next-line no-return-assign, no-param-reassign
      scaleInstance.width = 410;
      // eslint-disable-next-line no-return-assign, no-param-reassign
      scaleInstance.maxWidth = 410;
    },
  },
  legendPlugin: false,
  tooltipPlugin: { enabled: false },
  verticalHoverLinePlugin: false,
  backgroundChartPlugin: {
    backgroundColor: '#F9FAFB',
  },
  updateTicksLabelsPositionPlugin: {
    scale: 'y1',
    ranges: [0, 35, 75, 160, 235],
    labelsHeight: 14,
    labelsWidth: 380,
  },
  annotationPlugin: {
    annotations: {
      idealRange: {
        backgroundColor: 'rgb(250, 237, 234)',
        yMin: 100,
        yMax: 200,
        borderColor: 'transparent',
        type: 'box',
        drawTime: 'beforeDraw',
      },
    },
  },
});

const props = defineProps({
  filters: {
    type: Object,
    default: null,
  },
  isPublicView: {
    type: Boolean,
    default: false,
  },
});

const period = ref(SIX_MONTHS_PERIOD_FILTER);
const granularity = ref(MONTHLY_GRANULARITY_FILTER);
const average = ref(0);

const { cubejsApi } = mapGetters('widget');

const datasets = computed(() => [
  {
    name: 'Average monthly contributors',
    borderColor: 'transparent',
    backgroundColor: '#E94F2E',
    hoverBackgroundColor: '#E94F2E',
    barThickness: 24,
    borderWidth: 0,
    measure: 'Members.count',
    granularity: granularity.value.value,
    showLegend: false,
  },
]);

const query = computed(() => TOTAL_MONTHLY_ACTIVE_CONTRIBUTORS({
  period: period.value,
  granularity: granularity.value,
  selectedHasTeamMembers: props.filters.teamMembers,
}));

const onUpdatePeriod = (updatedPeriod) => {
  period.value = updatedPeriod;

  if (
    updatedPeriod.label === ALL_TIME_PERIOD_FILTER.label
  ) {
    granularity.value = YEARLY_GRANULARITY_FILTER;
  } else {
    granularity.value = MONTHLY_GRANULARITY_FILTER;
  }
};

const onAverageCalculation = (calculatedAverage) => {
  average.value = calculatedAverage;
};
</script>
