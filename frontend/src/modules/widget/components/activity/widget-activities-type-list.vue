<template>
  <query-renderer
    v-if="cubejsApi"
    :cubejs-api="cubejsApi"
    :query="ActivityTypesQuery"
  >
    <template
      #default="{
        resultSet: activityTypesResultSet,
        loading: activityTypesLoading,
        error: activityTypesError,
      }"
    >
      <query-renderer
        v-if="cubejsApi"
        :cubejs-api="cubejsApi"
        :query="ActivityCountQuery"
      >
        <template
          #default="{
            resultSet: activityCountResultSet,
            loading: activityCountLoading,
            error: activityCountError,
          }"
        >
          <!-- Loading -->
          <app-widget-loading
            v-if="(activityTypesLoading || activityCountLoading)"
            class="mb-8"
            type="table"
          />

          <!-- Empty -->
          <app-widget-empty
            v-else-if="!compileData(
              activityTypesResultSet,
            ).length"
            type="table"
          />

          <!-- Error -->
          <app-widget-error
            v-else-if="(activityTypesError || activityCountError)"
            class="mb-8"
          />

          <!-- Widget Chart -->
          <div v-else>
            <app-widget-activities-type
              :activity-types-data="compileData(
                activityTypesResultSet,
              )"
              :activity-count-data="computedScore(activityCountResultSet)"
            />

            <slot
              name="button"
              :show-button="showButton"
            />
          </div>
        </template>
      </query-renderer>
    </template>
  </query-renderer>
</template>

<script setup>
import { QueryRenderer } from '@cubejs-client/vue3';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { computed, ref } from 'vue';
import { LEADERBOARD_ACTIVITIES_TYPES_QUERY, LEADERBOARD_ACTIVITIES_COUNT_QUERY } from '@/modules/widget/widget-queries';
import AppWidgetLoading from '@/modules/widget/components/shared/widget-loading.vue';
import AppWidgetError from '@/modules/widget/components/shared/widget-error.vue';
import AppWidgetEmpty from '@/modules/widget/components/shared/widget-empty.vue';
import AppWidgetActivitiesType from '@/modules/widget/components/activity/widget-activities-type.vue';

const props = defineProps({
  filters: {
    type: Object,
    default: null,
  },
  selectedPeriod: {
    type: Object,
    default: null,
  },
  limit: {
    type: Number,
    default: null,
  },
});

const { cubejsApi } = mapGetters('widget');

const showButton = ref(false);

const ActivityTypesQuery = computed(() => LEADERBOARD_ACTIVITIES_TYPES_QUERY({
  period: props.selectedPeriod,
  selectedPlatforms: props.filters.platform.value,
  selectedHasTeamActivities: props.filters.teamActivities,
  selectedSegments: props.filters.segments,
}));

const ActivityCountQuery = computed(() => LEADERBOARD_ACTIVITIES_COUNT_QUERY({
  period: props.selectedPeriod,
  selectedPlatforms: props.filters.platform.value,
  selectedHasTeamActivities: props.filters.teamActivities,
  selectedSegments: props.filters.segments,
}));

const compileData = (resultSet) => {
  if (!resultSet) {
    return [];
  }

  const pivot = resultSet.chartPivot();

  const data = (pivot.map((el) => {
    const [plat, type] = el.x.split(',');

    return {
      total: el['Activities.count'],
      plat,
      type,
    };
  }));

  if (data.length > props.limit) {
    showButton.value = true;
  }

  if (props.limit) {
    return data.slice(0, props.limit);
  }

  return data;
};

const computedScore = (resultSet) => {
  const seriesNames = resultSet.seriesNames();
  const pivot = resultSet.chartPivot();
  let count = 0;

  seriesNames.forEach((e) => {
    const datas = pivot.map((p) => p[e.key]);

    count += datas.reduce((a, b) => a + b, 0);
  });

  return count;
};
</script>

<script>
export default {
  name: 'AppWidgetActivitiesType',
};
</script>
