<template>
  <div v-if="props.progress && props.progress.reportStatus !== 'calculating'" class="flex flex-col justify-center w-full h-full">
    <div v-if="!props.barOnly" class="flex justify-between items-center">
      <p class="text-2xs text-gray-500 leading-4">
        <span v-if="inProgress?.message">{{ inProgress?.message }}</span>
        <span v-else>Processing...</span>
      </p>

      <el-popover :width="280" placement="top-end">
        <template #reference>
          <div class="h-5 w-5">
            <i class="ri-question-line text-lg text-gray-400 flex items-center h-5" />
          </div>
        </template>
        <app-integration-progress :progress="props.progress" />
      </el-popover>
    </div>
    <div v-if="inProgress?.percentage" class="rounded-md h-1 bg-gray-200 mt-1.5">
      <div class="rounded-md h-1 bg-brand-800" :style="{ width: `${inProgress?.percentage}%` }" />
    </div>
  </div>
  <div v-else class="flex justify-between items-center h-full">
    <p class="text-2xs text-gray-500 leading-4">
      <span v-if="props.progress">
        Calculating...
      </span>
      <span v-else>
        Loading progress...
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import AppIntegrationProgress from '@/modules/integration/components/integration-progress.vue';
import { IntegrationProgress } from '@/modules/integration/types/IntegrationProgress';
import { computed } from 'vue';

const props = defineProps<{
  progress: IntegrationProgress | null,
  barOnly?: boolean
}>();

const inProgress = computed(() => {
  if (!props.progress) {
    return null;
  }
  return Object.values(props.progress.data).find((p) => p.status === 'in-progress');
});
</script>

<script lang="ts">
export default {
  name: 'AppIntegrationProgressBar',
};
</script>
