<template>
  <div v-if="props.progress">
    <!-- Header -->
    <div>
      <slot />
    </div>

    <!-- Bar -->
    <div v-if="props.showBar && props.progress?.percentage" class="rounded-md h-1 bg-gray-200">
      <div class="rounded-md h-1 bg-brand-800" :style="{ width: `${props.progress?.percentage}%` }" />
    </div>

    <!-- Details -->
    <div class="flex flex-col gap-2.5">
      <div v-for="(part, pi) of parts" :key="pi" class="flex items-center">
        <i v-if="part.status === 'ok'" class="ri-checkbox-circle-fill text-green-500 text-base mr-2 h-4 flex items-center" />
        <div v-else-if="part.status === 'in-progress'" class="flex items-center justify-center h-4 w-4 mr-2">
          <cr-spinner size="0.75rem" />
        </div>
        <div v-else class="flex items-center justify-center h-4 w-4 mr-2" />

        <p class="text-gray-600 text-2xs">
          {{ part.message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CrSpinner from '@/ui-kit/spinner/Spinner.vue';
import { IntegrationProgress, IntegrationProgressPart } from '@/modules/integration/types/IntegrationProgress';
import { computed } from 'vue';

const props = defineProps<{
  progress: IntegrationProgress | null,
  showBar?: boolean,
}>();

const statusPriority = {
  ok: 1,
  'in-progress': 2,
};

const priority = (status: string) => statusPriority[status] || (Object.keys(statusPriority).length + 1);

const parts = computed<IntegrationProgressPart[]>(() => {
  if (!props.progress?.data) {
    return [];
  }

  return Object.values(props.progress.data).sort((a, b) => priority(a.status) - priority(b.status));
});
</script>

<script lang="ts">
export default {
  name: 'AppIntegrationProgress',
};
</script>
