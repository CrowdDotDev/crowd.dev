<template>
  <div>
    <div v-if="!props.barOnly" class="flex justify-between items-center mb-1.5">
      <p class="text-2xs text-gray-500 leading-4">
        100 out of 1,000 data streams processed...
      </p>
      <el-popover :width="280" placement="top-end">
        <template #reference>
          <div class="h-5 w-5">
            <i class="ri-question-line text-lg text-gray-400 flex items-center h-5" />
          </div>
        </template>
        <app-integration-progress :integration="props.integration" />
      </el-popover>
    </div>
    <div class="rounded-md h-1 bg-gray-200">
      <div class="rounded-md h-1 bg-brand-800" style="width: 40%" />
    </div>
  </div>
</template>

<script setup>
import AppIntegrationProgress from '@/modules/integration/components/integration-progress.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});
</script>

<script>
export default {
  name: 'AppIntegrationProgressBar',
};
</script>
