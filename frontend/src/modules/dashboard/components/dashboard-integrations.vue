<template>
  <app-integration-progress-wrapper :segments="segmentIds">
    <template #default="{ progress }">
      <div v-if="progress?.length" class="border border-gray-200 rounded-lg overflow-hidden w-full" v-bind="$attrs">
        <div class="pt-4 px-4 pb-6 bg-gradient-to-b from-brand-25 to-white flex items-center">
          <div class="h-5 w-5 flex items-center justify-center mr-1">
            <cr-spinner size="1rem" class="!border-brand-800" />
          </div>
          <h6 class="text-base leading-5 font-semibold">
            Connecting integrations...
          </h6>
        </div>
        <section v-for="segment of getSegmentList(progress)" :key="segment.id" class="px-4">
          <div class="pb-4">
            <p class="text-2xs leading-4.5 text-gray-400 mb-0.5">
              Sub-project
            </p>
            <p class="text-xs font-semibold leading-4.5">
              {{ segment.name }}
            </p>
          </div>
          <article v-for="integration of segment.integrations" :key="`${segment.id}:${integration.platform}`" class="pb-4 flex w-full">
            <div class="w-4 !min-w-4 mr-2 basis-4">
              <img :alt="integration.type" :src="CrowdIntegrations.getConfig(integration.type)?.image" class="w-4 h-4 min-w-4">
            </div>
            <div class="-mt-px flex-grow">
              <app-integration-progress-bar :progress="integration" />
            </div>
          </article>
        </section>
      </div>
    </template>
  </app-integration-progress-wrapper>
</template>

<script lang="ts" setup>

import CrSpinner from '@/ui-kit/spinner/Spinner.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppIntegrationProgressBar from '@/modules/integration/components/integration-progress-bar.vue';
import AppIntegrationProgressWrapper from '@/modules/integration/components/integration-progress-wrapper.vue';
import { IntegrationProgress } from '@/modules/integration/types/IntegrationProgress';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

interface SegmentIntegrations {
  id: string;
  name: string;
  integrations: IntegrationProgress[],
}

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const segmentIds = computed(() => selectedProjectGroup.value?.projects.map((p) => p.subprojects.map((sp) => sp.id)).flat() || []);

const getSegmentList = (progress: IntegrationProgress[]): SegmentIntegrations[] => {
  if (!progress) {
    return [];
  }
  const segmentIntegrations: Record<string, IntegrationProgress[]> = {};
  progress.forEach((p) => {
    if (!segmentIntegrations[p.segmentId]) {
      segmentIntegrations[p.segmentId] = [];
    }
    segmentIntegrations[p.segmentId].push(p);
  });
  return Object.keys(segmentIntegrations).map((id) => {
    const list = segmentIntegrations[id];
    return {
      id,
      name: list.length > 0 ? list[0].segmentName : id,
      integrations: list,
    };
  });
};
</script>

<script lang="ts">
export default {
  name: 'CrDashboardIntegrations',
};
</script>
