<template>
  <div class="bg-white pt-5 rounded-lg shadow">
    <div class="px-6 pb-8">
      <!-- Widget Header -->
      <div
        class="flex grow justify-between items-center pb-5 border-b border-gray-100 mb-8"
      >
        <div class="flex gap-1">
          <app-widget-title
            title="Leaderboard: Activities by type"
          />
        </div>
        <app-widget-period
          template="Activities"
          widget="Leaderboard: Activities by type"
          :period="selectedPeriod"
          module="reports"
          @on-update="onUpdatePeriod"
        />
      </div>

      <app-widget-activities-type-list
        :filters="filters"
        :selected-period="selectedPeriod"
        :limit="10"
      >
        <template #button="{ showButton }">
          <div
            v-if="showButton"
            class="flex justify-end"
          >
            <el-button
              class="btn btn-link btn-link--primary mt-4 !h-8"
              @click="handleDrawerOpen"
            >
              View all
            </el-button>
          </div>
        </template>
      </app-widget-activities-type-list>

      <app-widget-cube-drawer
        v-if="drawerExpanded"
        v-model="drawerExpanded"
        :title="drawerTitle"
        :period="drawerSelectedPeriod"
        :template="ACTIVITIES_REPORT.nameAsId"
        size="480px"
        @on-period-update="onDrawerUpdatePeriod"
      >
        <template #drawerContent>
          <app-widget-activities-type-list
            :filters="filters"
            :selected-period="drawerSelectedPeriod"
          />
        </template>
      </app-widget-cube-drawer>
    </div>
  </div>
</template>

<script setup>
import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants';
import { ref } from 'vue';
import AppWidgetTitle from '@/modules/widget/components/v2/shared/widget-title.vue';
import AppWidgetPeriod from '@/modules/widget/components/v2/shared/widget-period.vue';
import AppWidgetCubeDrawer from '@/modules/widget/components/v2/shared/widget-cube-drawer.vue';
import { ACTIVITIES_REPORT } from '@/modules/report/templates/template-reports';
import AppWidgetActivitiesTypeList from '@/modules/widget/components/v2/activity/widget-activities-type-list.vue';

defineProps({
  filters: {
    type: Object,
    default: null,
  },
});

const drawerExpanded = ref();
const drawerTitle = ref('Leaderboard: Activities by type');

const selectedPeriod = ref(SEVEN_DAYS_PERIOD_FILTER);
const drawerSelectedPeriod = ref(SEVEN_DAYS_PERIOD_FILTER);

const onUpdatePeriod = (updatedPeriod) => {
  selectedPeriod.value = updatedPeriod;
};

const onDrawerUpdatePeriod = (updatedPeriod) => {
  drawerSelectedPeriod.value = updatedPeriod;
};

const handleDrawerOpen = () => {
  drawerExpanded.value = true;
};
</script>

<script>
export default {
  name: 'AppWidgetActivitiesLeaderboard',
};
</script>
