<template>
  <app-integration-progress-wrapper :segments="segmentIds">
    <template #default="{ progress, progressError }">
      <div v-if="progress?.length || progressError" class="border border-gray-200 rounded-lg overflow-hidden w-full" v-bind="$attrs">
        <div class="pt-4 px-4 pb-6 bg-gradient-to-b from-primary-25 to-white flex items-center">
          <div class="h-5 w-5 flex items-center justify-center mr-1">
            <lf-spinner size="1rem" class="!border-primary-800" />
          </div>
          <h6 class="text-base leading-5 font-semibold font-secondary">
            Connecting integrations...
          </h6>
        </div>
        <div v-if="progressError" class="px-4 text-xs text-gray-500 my-2 flex items-center">
          <lf-icon name="triangle-exclamation" type="solid" class="text-yellow-600 mr-1" />
          Error loading progress
        </div>
        <section
          v-for="(segment, si) of getSegmentList(progress)"
          :key="segment.id"
          class="px-4 border-gray-200"
          :class="si > 0 ? 'border-t pt-4' : ''"
        >
          <div class="pb-4">
            <p class="text-2xs leading-4.5 text-gray-400 mb-0.5 font-medium">
              Sub-project
            </p>
            <p class="text-xs font-semibold leading-4.5">
              {{ segment.name }}
            </p>
          </div>
          <article v-for="integration of segment.integrations" :key="`${segment.id}:${integration.platform}`" class="pb-4 flex w-full">
            <div class="w-4 !min-w-4 mr-2 basis-4">
              <img :alt="integration.platform" :src="lfIdentities[integration.platform]?.image" class="h-4 min-w-4">
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
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import AppIntegrationProgressBar from '@/modules/integration/components/integration-progress-bar.vue';
import AppIntegrationProgressWrapper from '@/modules/integration/components/integration-progress-wrapper.vue';
import { IntegrationProgress } from '@/modules/integration/types/IntegrationProgress';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { lfIdentities } from '@/config/identities';

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
  name: 'LfDashboardIntegrations',
};
</script>
