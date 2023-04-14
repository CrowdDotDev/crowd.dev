<template>
  <div>
    <div
      v-if="loadingCube"
      v-loading="loadingCube"
      class="app-page-spinner"
    />
    <div v-else class="flex flex-col gap-8">
      <app-widget-activities-kpi
        :filters="filters"
      />
      <app-widget-new-activities
        :filters="filters"
      />
      <app-widget-activities-leaderboard
        :filters="filters"
      />
    </div>
  </div>
</template>

<script setup>import { computed, onMounted } from 'vue';
import { mapActions, mapGetters } from '@/shared/vuex/vuex.helpers';
import AppWidgetActivitiesKpi from '@/modules/widget/components/v2/activity/widget-activities-kpi.vue';
import AppWidgetNewActivities from '@/modules/widget/components/v2/activity/widget-new-activities.vue';
import AppWidgetActivitiesLeaderboard from '@/modules/widget/components/v2/activity/widget-activities-leaderboard.vue';

defineProps({
  filters: {
    type: Object,
    required: true,
  },
});

const { cubejsApi, cubejsToken } = mapGetters('widget');
const { getCubeToken } = mapActions('widget');

const loadingCube = computed(
  () => cubejsToken.value === null,
);

onMounted(async () => {
  if (cubejsApi.value === null) {
    await getCubeToken();
  }
});
</script>

<script>
export default {
  name: 'AppReportActivitiesTemplate',
};
</script>
