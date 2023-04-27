<template>
  <div class="widget-total-activities">
    <div class="flex justify-between items-center pb-5 mb-4 border-b border-gray-100">
      <app-widget-title
        text-size="text-base"
        title="Total activities"
      />
      <app-widget-period
        :period="period"
        module="report"
        @on-update="
          (updatedPeriod) => (period = updatedPeriod)
        "
      />
    </div>
    <div>
      <query-renderer
        v-if="cubejsApi"
        :cubejs-api="cubejsApi"
        :query="query"
      >
        <template #default="{ resultSet, loading, error }">
          <!-- Loading -->
          <app-widget-loading
            v-if="loading"
            size="small"
          />

          <!-- Error -->
          <app-widget-error v-else-if="error" />

          <!-- Widgets -->
          <div v-else class="grid grid-cols-12 gap-2">
            <div class="col-span-5">
              <app-widget-kpi
                :current-value="kpiCurrentValue(resultSet)"
                :previous-value="
                  kpiPreviousValue(resultSet)
                "
                :vs-label="`vs. last ${period.extendedLabel}`"
                class="col-span-5"
              />
            </div>
            <div class="col-span-7 chart">
              <app-widget-area
                :result-set="chartResultSet(resultSet)"
                :datasets="datasets"
                :chart-options="widgetChartOptions"
                :granularity="granularity"
                :is-grid-min-max="true"
                :show-min-as-value="true"
              />
            </div>
          </div>
        </template>
      </query-renderer>
    </div>
  </div>
</template>
<script setup>
import moment from 'moment';
import cloneDeep from 'lodash/cloneDeep';
import { ref, computed, defineProps } from 'vue';
import { QueryRenderer } from '@cubejs-client/vue3';
import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants';
import { chartOptions } from '@/modules/report/templates/template-report-charts';

import AppWidgetKpi from '@/modules/widget/components/v2/shared/widget-kpi.vue';
import AppWidgetTitle from '@/modules/widget/components/v2/shared/widget-title.vue';
import AppWidgetPeriod from '@/modules/widget/components/v2/shared/widget-period.vue';
import AppWidgetArea from '@/modules/widget/components/v2/shared/widget-area.vue';
import AppWidgetLoading from '@/modules/widget/components/v2/shared/widget-loading.vue';
import AppWidgetError from '@/modules/widget/components/v2/shared/widget-error.vue';

import {
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import { getTimeGranularityFromPeriod } from '@/utils/reports';
import {
  TOTAL_ACTIVITIES_QUERY,
} from '@/modules/widget/widget-queries';

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

const period = ref(SEVEN_DAYS_PERIOD_FILTER);

const widgetChartOptions = chartOptions('area', {
  legendPlugin: false,
});

const granularity = computed(() => getTimeGranularityFromPeriod(period.value));
const datasets = computed(() => [
  {
    name: 'Total activities',
    borderColor: '#E94F2E',
    measure: 'Activities.cumulativeCount',
    granularity: granularity.value,
  },
]);

const { cubejsApi } = mapGetters('widget');

const query = computed(() => TOTAL_ACTIVITIES_QUERY({
  period: period.value,
  granularity,
  selectedPlatforms: props.filters.platform.value,
  selectedHasTeamActivities: props.filters.teamActivities,
}));

const kpiCurrentValue = (resultSet) => {
  const data = resultSet.chartPivot();
  return Number(
    data[data.length - 1]['Activities.cumulativeCount'],
  ) || 0;
};

const kpiPreviousValue = (resultSet) => {
  const data = resultSet.chartPivot();
  return Number(data[0]['Activities.cumulativeCount']) || 0;
};

const spliceFirstValue = (data) => cloneDeep(data).reduce((acc, item, index) => {
  if (index !== 0) {
    acc.push({
      ...item,
    });
  }
  return acc;
}, []);

const chartResultSet = (resultSet) => {
  const clone = cloneDeep(resultSet);

  // We'll be excluding the first data point, since it's related to the last period
  clone.loadResponses[0].data = spliceFirstValue(
    clone.loadResponses[0].data,
  );

  // Then we also fix the first entry of the dateRange
  clone.loadResponses[0].query.timeDimensions[0].dateRange[0] = moment(
    clone.loadResponses[0].query.timeDimensions[0]
      .dateRange[0],
  )
    .utc()
    .add(1, 'day')
    .format('YYYY-MM-DD');

  return clone;
};
</script>

<style lang="scss" scoped>
.widget-total-activities {
  @apply bg-white shadow rounded-lg p-5;
  :deep(.chart) {
    div {
      line-height: 100px !important;
      height: auto !important;
    }
    .cube-widget-chart {
      padding: 0;
      min-height: 0;
    }
    canvas {
      height: 100px;
    }
  }
}
</style>
