<template>
  <div class="bg-white pt-5 rounded-lg shadow">
    <query-renderer v-if="cubejsApi" :cubejs-api="cubejsApi" :query="query">
      <template #default="{ resultSet, loading, error }">
        <div class="px-6">
          <div
            class="flex grow justify-between items-center pb-5 border-b border-gray-100"
            :class="{ 'mb-8': !loading && !error }"
          >
            <div class="flex gap-1">
              <app-widget-title
                :title="BENCHMARK_WIDGET.name"
                :description="BENCHMARK_WIDGET.description"
              />
            </div>

            <app-widget-period
              :template="PRODUCT_COMMUNITY_FIT_REPORT.nameAsId"
              :widget="BENCHMARK_WIDGET.name"
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
        <app-widget-insight v-if="!loading">
          <template #description>
            <span>Considering the contribution history of over 150,000 open-source
              repositories, we come to the conclusion that you
              {{
                average < 20
                  ? "didn't achieve Early signals of Product-Community Fit"
                  : 'had'
              }}
              <span v-if="average >= 20" class="font-medium">{{
                getInsightContent
              }}</span>{{
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
      </template>
    </query-renderer>
  </div>
</template>

<script setup>
import { computed, ref, defineProps } from 'vue';
import pluralize from 'pluralize';
import { QueryRenderer } from '@cubejs-client/vue3';
import AppWidgetTitle from '@/modules/widget/components/shared/widget-title.vue';
import AppWidgetPeriod from '@/modules/widget/components/shared/widget-period.vue';
import AppWidgetInsight from '@/modules/widget/components/shared/widget-insight.vue';
import AppWidgetAverageKpi from '@/modules/widget/components/shared/widget-average-kpi.vue';
import AppWidgetBar from '@/modules/widget/components/shared/widget-bar.vue';
import AppWidgetLoading from '@/modules/widget/components/shared/widget-loading.vue';
import AppWidgetError from '@/modules/widget/components/shared/widget-error.vue';
import {
  MONTHLY_GRANULARITY_FILTER,
  SIX_MONTHS_PERIOD_FILTER,
  MONTHLY_WIDGET_PERIOD_OPTIONS,
} from '@/modules/widget/widget-constants';
import { getSelectedPeriodFromLabel } from '@/modules/widget/widget-utility';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { TOTAL_MONTHLY_ACTIVE_CONTRIBUTORS } from '@/modules/widget/widget-queries';
import { chartOptions } from '@/modules/report/templates/template-chart-config';
import PRODUCT_COMMUNITY_FIT_REPORT, {
  BENCHMARK_WIDGET,
} from '@/modules/report/templates/config/productCommunityFit';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  filters: {
    type: Object,
    default: null,
  },
  isPublicView: {
    type: Boolean,
    default: false,
  },
  widget: {
    type: Object,
    default: null,
  },
});

const route = useRoute();
const router = useRouter();
const period = ref(
  getSelectedPeriodFromLabel(
    route.query.benchmarkPeriod,
    SIX_MONTHS_PERIOD_FILTER,
  ),
);
const granularity = ref(MONTHLY_GRANULARITY_FILTER);
const average = ref(0);

const getInsightContent = computed(() => {
  if (average.value >= 20 && average.value <= 50) {
    return 'Early signals of Product-Community Fit';
  }
  if (average.value > 50 && average.value <= 100) {
    return 'Strong emerging signals of Product-Community Fit';
  }
  if (average.value > 100 && average.value <= 200) {
    return 'Great Product-Community Fit';
  }

  return 'Scale beyond Product-Community Fit';
});

const benchmarkChartOptions = computed(() => chartOptions('bar', {
  clip: true,
  xTicks: false,
  xLines: false,
  xType: 'category',
  yLines: false,
  yLinesDrawOnChartArea: false,
  yTicksAutoSkip: false,
  yMin: 0,
  yMax: 250,
  yAfterBuildTicks: (axis) => {
    Object.assign(axis, {
      ticks: [0, 20, 50, 100, 200].map((v) => ({
        value: v,
      })),
    });
  },
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
    afterBuildTicks: (axis) => {
      Object.assign(axis, {
        ticks: [0, 20, 50, 100, 200].map((v) => ({
          value: v,
        })),
      });
    },
    afterTickToLabelConversion: (axis) => {
      const match = {
        color: '#111827',
        fontWeight: 500,
      };
      const unmatch = {
        color: '#9CA3AF',
        fontWeight: 400,
      };

      const getMatch = (min, max) => (average.value >= min && (!max || average.value <= max)
        ? match
        : unmatch);

      const labels = [
        { text: '' },
        {
          text: 'Early signals of Product-Community Fit (20-50)',
          color: getMatch(20, 50).color,
          fontWeight: getMatch(20, 50).fontWeight,
        },
        {
          text: 'Strong emerging signals of Product-Community Fit (51-100)',
          color: getMatch(51, 100).color,
          fontWeight: getMatch(51, 100).fontWeight,
        },
        {
          text: 'Great Product-Community Fit (101-200)',
          color: getMatch(101, 200).color,
          fontWeight: getMatch(101, 200).fontWeight,
        },
        {
          text: 'Scale beyond Product-Community Fit (200+)',
          color: getMatch(201).color,
          fontWeight: getMatch(201).fontWeight,
        },
      ];

      Object.assign(axis, {
        ticks: axis.ticks.map(({ value }, i) => ({
          value,
          ...labels[i],
        })),
      });
    },
    afterFit: (scaleInstance) => {
      Object.assign(scaleInstance, {
        width: 400,
        maxWidth: 410,
      });
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
      idealRange: () => {
        const getIdealRange = () => {
          if (average.value < 20) {
            return {
              min: 0,
              max: 20,
            };
          }
          if (average.value >= 20 && average.value <= 50) {
            return {
              min: 20,
              max: 50,
            };
          }
          if (average.value > 50 && average.value <= 100) {
            return {
              min: 51,
              max: 100,
            };
          }
          if (average.value > 100 && average.value <= 200) {
            return {
              min: 101,
              max: 200,
            };
          }

          return {
            min: 200,
            max: 250,
          };
        };

        return {
          backgroundColor: 'rgb(250, 237, 234)',
          yMin: getIdealRange().min,
          yMax: getIdealRange().max,
          borderColor: 'transparent',
          type: 'box',
          drawTime: 'beforeDraw',
        };
      },
    },
  },
}));

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
  granularity.value = MONTHLY_GRANULARITY_FILTER;
  router.replace({
    query: {
      ...route.query,
      benchmarkPeriod: updatedPeriod.label,
    },
  });
};

const onAverageCalculation = (calculatedAverage) => {
  average.value = calculatedAverage;
};
</script>
