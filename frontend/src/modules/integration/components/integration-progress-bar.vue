<template>
  <div v-if="props.progress && props.progress.reportStatus !== 'calculating'" class="flex flex-col justify-center w-full h-full">
    <div v-if="!props.barOnly" class="progress-message-wrapper">
      <p class="progress-message">
        <span class="progress-message-text">
          <span v-if="inProgress?.message" v-html="inProgress?.message" />
          <span v-else>Processing still in progress. Please wait for data stream updates.</span>
        </span>
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
      <div class="rounded-md h-1 bg-primary-800" :style="{ width: `${inProgress?.percentage}%` }" />
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

<style scoped>
.progress-message-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.progress-message {
  font-size: 10px;
  color: #6B7280;
  line-height: 16px;
  padding-right: 16px;
  flex-grow: 1;
  min-width: 0;
}

.progress-message-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
