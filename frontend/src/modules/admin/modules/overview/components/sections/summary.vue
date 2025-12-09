<template>
  <div class="flex gap-4">
    <!-- TODO: revisit this implementation when the backend is ready -->
    <!-- we may use loop to render the cards -->
    <lf-card class="flex-1 p-4 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold">Projects</span>
        <lf-icon name="folders" type="light" class="text-gray-400" />
      </div>
      <div class="text-xl font-light">
        640
      </div>
      <app-lf-overview-trend-display :data="projectsTrends" />
    </lf-card>
    <lf-card class="flex-1 p-4 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold">People</span>
        <lf-icon name="people-group" type="light" class="text-gray-400" />
      </div>
      <div class="text-xl font-light">
        640
      </div>
      <app-lf-overview-trend-display :data="peopleTrends" />
    </lf-card>
    <lf-card class="flex-1 p-4 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold">Organizations</span>
        <lf-icon name="building" type="light" class="text-gray-400" />
      </div>
      <div class="text-xl font-light">
        640
      </div>
      <app-lf-overview-trend-display :data="organizationsTrends" />
    </lf-card>
    <lf-card class="flex-1 p-4 flex flex-col gap-2" v-if="!selectedProject">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold">Activities</span>
        <lf-icon name="monitor-waveform" type="light" class="text-gray-400" />
      </div>
      <div class="text-xl font-light">
        640
      </div>
      <app-lf-overview-trend-display :data="activitiesTrends" />
    </lf-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LfCard from '@/ui-kit/card/Card.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import AppLfOverviewTrendDisplay from '@/modules/admin/modules/overview/components/fragments/trend-display.vue';
import type { OverviewTrends } from '@/modules/admin/modules/overview/types/overview.types';
import { useOverviewStore } from '../../store/overview.store';
import { storeToRefs } from 'pinia';

const overviewStore = useOverviewStore();
const { selectedProject } = storeToRefs(overviewStore);

const projectsTrends = ref<OverviewTrends>({
  current: 640,
  previous: 500,
  period: 'vs. last 30d',
});

const peopleTrends = ref<OverviewTrends>({
  current: 640,
  previous: 600,
  period: 'vs. previous 30d',
});

const organizationsTrends = ref<OverviewTrends>({
  current: 640,
  previous: 700,
  period: 'vs. previous 12M period',
});

const activitiesTrends = ref<OverviewTrends>({
  current: 640,
  previous: 400,
  period: 'vs. previous 30d',
});
</script>

<script lang="ts">
export default {
  name: 'AppLfOverviewSummary',
};
</script>