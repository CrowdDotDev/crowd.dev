<template>
  <div class="panel-card">
    <div class="grid grid-cols-3">
      <div
        v-for="(widget, index) of widgets"
        :key="index"
        class="p-6"
        :class="
          index !== 0
            ? 'border-l border-r border-gray-100'
            : ''
        "
      >
        <app-widget-title
          class="mb-4"
          text-size="text-xs"
          :title="widget.title"
        />

        <query-renderer
          v-if="cubejsApi"
          :cubejs-api="cubejsApi"
          :query="widget.query"
        >
          <template
            #default="{ resultSet, loading, error }"
          >
            <!-- Loading -->
            <app-widget-loading
              v-if="loading || !resultSet?.loadResponses"
              type="kpi"
            />

            <!-- Error -->
            <app-widget-error
              v-else-if="error"
              type="kpi"
            />

            <app-widget-kpi
              v-else
              :current-value="kpiCurrentValue(resultSet)"
              :previous-value="kpiPreviousValue(resultSet)"
              :vs-label="`vs. ${widget.period === 'day' ? 'yesterday' : `last ${widget.period}`}`"
            />
          </template>
        </query-renderer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { QueryRenderer } from '@cubejs-client/vue3';
import { ACTIVITIES_QUERY } from '@/modules/widget/widget-queries';
import {
  DAILY_GRANULARITY_FILTER,
  FOURTEEN_DAYS_PERIOD_FILTER,
  MONTHLY_GRANULARITY_FILTER,
  ONE_DAY_PERIOD_FILTER,
  THIRTY_DAYS_PERIOD_FILTER,
  WEEKLY_GRANULARITY_FILTER,
} from '@/modules/widget/widget-constants';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppWidgetKpi from '@/modules/widget/components/shared/widget-kpi.vue';
import AppWidgetTitle from '@/modules/widget/components/shared/widget-title.vue';
import AppWidgetLoading from '@/modules/widget/components/shared/widget-loading.vue';
import AppWidgetError from '@/modules/widget/components/shared/widget-error.vue';
import { ACTIVITIES_KPI_WIDGET } from '@/modules/report/templates/config/activities';

const props = defineProps({
  filters: {
    type: Object,
    default: null,
  },
});

const { cubejsApi } = mapGetters('widget');

const query = (period, granularity) => ACTIVITIES_QUERY({
  period,
  granularity,
  selectedPlatforms: props.filters.platform.value,
  selectedHasTeamActivities: props.filters.teamActivities,
  selectedSegments: props.filters.segments.childSegments,
});

const widgets = computed(() => [
  {
    title: `${ACTIVITIES_KPI_WIDGET.name} today`,
    query: query(
      ONE_DAY_PERIOD_FILTER,
      DAILY_GRANULARITY_FILTER,
    ),
    period: 'day',
  },
  {
    title: `${ACTIVITIES_KPI_WIDGET.name} this week`,
    query: query(
      FOURTEEN_DAYS_PERIOD_FILTER,
      WEEKLY_GRANULARITY_FILTER,
    ),
    period: 'week',
  },
  {
    title: `${ACTIVITIES_KPI_WIDGET.name} this month`,
    query: query(
      THIRTY_DAYS_PERIOD_FILTER,
      MONTHLY_GRANULARITY_FILTER,
    ),
    period: 'month',
  },
]);

const kpiCurrentValue = (resultSet) => {
  if (resultSet.loadResponses[0].data.length === 0) {
    // if we get an empty data points array from cube
    return 0;
  }
  const pivot = resultSet.chartPivot();
  return Number(pivot[pivot.length - 1]['Activities.count']);
};

const kpiPreviousValue = (resultSet) => {
  if (resultSet.loadResponses[0].data.length === 0) {
    // if we get an empty data points array from cube
    return 0;
  }
  const pivot = resultSet.chartPivot();
  return Number(pivot[pivot.length - 2]['Activities.count']);
};
</script>

<script>
export default {
  name: 'AppWidgetActivitiesKpi',
};
</script>
