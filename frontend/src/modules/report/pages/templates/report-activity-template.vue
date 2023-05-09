<template>
  <div>
    <div
      v-if="loadingCube"
      v-loading="loadingCube"
      class="app-page-spinner"
    />
    <div v-else class="flex flex-col gap-8">
      <div
        v-for="widget in ACTIVITIES_REPORT.widgets"
        :key="widget.id"
      >
        <component
          :is="widget.component"
          v-if="!(widget.hideForSinglePlatform && filters.platform.value.length === 1)"
          :filters="filters"
        />
      </div>
    </div>
  </div>
</template>

<script setup>import { computed, onMounted } from 'vue';
import { mapActions, mapGetters } from '@/shared/vuex/vuex.helpers';
import ACTIVITIES_REPORT from '@/modules/report/templates/config/activities';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { ActivityTypeService } from '@/modules/activity/services/activity-type-service';

defineProps({
  filters: {
    type: Object,
    required: true,
  },
});

const { cubejsApi, cubejsToken } = mapGetters('widget');
const { getCubeToken } = mapActions('widget');

const activityTypeStore = useActivityTypeStore();
const { setTypes } = activityTypeStore;

const loadingCube = computed(
  () => cubejsToken.value === null,
);

onMounted(async () => {
  if (cubejsApi.value === null) {
    await getCubeToken();
  }

  ActivityTypeService.get().then((activityTypes) => {
    setTypes(activityTypes);
  });
});
</script>

<script>
export default {
  name: 'AppReportActivitiesTemplate',
};
</script>
