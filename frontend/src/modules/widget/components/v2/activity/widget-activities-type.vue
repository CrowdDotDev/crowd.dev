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
            <article
              v-for="{ total, plat, type } of data"
              :key="`${plat}-${type}`"
              class="border-t border-gray-100 py-4 flex items-center justify-between first:border-none"
            >
              <div class="flex items-center">
                <img
                  v-if="plat !== 'other'"
                  class="w-4 h-4 mr-3"
                  :src="getPlatformDetails(plat)?.image"
                  :alt="getPlatformDetails(plat)?.name"
                />
                <p class="text-xs leading-5 activity-type first-letter:uppercase">
                  <app-i18n
                    v-if="plat !== 'other'"
                    :code="`entities.activity.${plat}.${type}`"
                  />
                  <span v-else>
                    {{ otherActivityTypes[type].display.short }}
                  </span>
                </p>
              </div>
              <p class="text-xs text-gray-500">
                {{ total }} activities ・
                {{
                  (
                    (total
                      / computedScore(activityCountResultSet))
                    * 100
                  ).toFixed(1)
                }}%
              </p>
            </article>
            <slot
              name="button"
              :show-button="data.length > limit"
            />
          </div>

          <slot name="drawer" />
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
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppWidgetLoading from '@/modules/widget/components/v2/shared/widget-loading.vue';
import AppWidgetError from '@/modules/widget/components/v2/shared/widget-error.vue';
import AppWidgetEmpty from '@/modules/widget/components/v2/shared/widget-empty.vue';

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
const { currentTenant } = mapGetters('auth');

const data = ref([]);

const ActivityTypesQuery = computed(() => LEADERBOARD_ACTIVITIES_TYPES_QUERY({
  period: props.selectedPeriod,
  selectedPlatforms: props.filters.platform.value,
  selectedHasTeamActivities: props.filters.teamActivities,
}));

const ActivityCountQuery = computed(() => LEADERBOARD_ACTIVITIES_COUNT_QUERY({
  period: props.selectedPeriod,
  selectedPlatforms: props.filters.platform.value,
  selectedHasTeamActivities: props.filters.teamActivities,
}));

const otherActivityTypes = computed(() => {
  if (!currentTenant.value) {
    return {};
  }

  return currentTenant.value.settings[0].customActivityTypes.other;
});

const compileData = (resultSet) => {
  if (!resultSet) {
    return [];
  }

  const pivot = resultSet.chartPivot();

  data.value = (pivot.map((el) => {
    const [plat, type] = el.x.split(',');
    return {
      total: el['Activities.count'],
      plat,
      type,
    };
  }));

  if (props.limit) {
    return data.value.slice(0, props.limit);
  }

  return data.value;
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

const getPlatformDetails = (plat) => CrowdIntegrations.getConfig(plat);
</script>

<script>
export default {
  name: 'AppWidgetActivitiesType',
};
</script>
