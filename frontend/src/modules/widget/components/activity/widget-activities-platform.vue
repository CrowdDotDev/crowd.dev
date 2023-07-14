<template>
  <div class="panel-card pt-5">
    <div class="px-6 pb-8">
      <!-- Widget Header -->
      <div
        class="flex grow justify-between items-center pb-5 border-b border-gray-100 mb-8"
      >
        <div class="flex gap-1">
          <app-widget-title
            :title="ACTIVITIES_PLATFORM_WIDGET.name"
          />
        </div>
        <app-widget-period
          :template="ACTIVITIES_REPORT.nameAsId"
          :widget="ACTIVITIES_PLATFORM_WIDGET.name"
          :period="selectedPeriod"
          module="reports"
          @on-update="onUpdatePeriod"
        />
      </div>

      <query-renderer
        v-if="cubejsApi"
        :cubejs-api="cubejsApi"
        :query="query"
      >
        <template #default="{ resultSet, loading }">
          <app-widget-activities-platform-content
            :loading="loading"
            :result-set="resultSet"
          />
        </template>
      </query-renderer>
    </div>
  </div>
</template>

<script setup>
import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants';
import { computed, ref } from 'vue';
import AppWidgetTitle from '@/modules/widget/components/shared/widget-title.vue';
import AppWidgetPeriod from '@/modules/widget/components/shared/widget-period.vue';
import { QueryRenderer } from '@cubejs-client/vue3';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { LEADERBOARD_ACTIVITIES_TYPES_QUERY } from '@/modules/widget/widget-queries';
import ACTIVITIES_REPORT, { ACTIVITIES_PLATFORM_WIDGET } from '@/modules/report/templates/config/activities';
import AppWidgetActivitiesPlatformContent from './widget-activities-platform-content.vue';

const props = defineProps({
  filters: {
    type: Object,
    default: null,
  },
});

const { cubejsApi } = mapGetters('widget');

const selectedPeriod = ref(SEVEN_DAYS_PERIOD_FILTER);

const query = computed(() => LEADERBOARD_ACTIVITIES_TYPES_QUERY({
  period: selectedPeriod.value,
  selectedPlatforms: props.filters.platform.value,
  selectedHasTeamActivities: props.filters.teamActivities,
  selectedSegments: props.filters.segments.childSegments,
}));

const onUpdatePeriod = (updatedPeriod) => {
  selectedPeriod.value = updatedPeriod;
};

</script>
<script>
export default {
  name: 'AppWidgetActivitiesPlatform',
};
</script>
