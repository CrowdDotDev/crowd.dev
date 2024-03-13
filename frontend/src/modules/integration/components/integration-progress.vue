<template>
  <div>
    <!-- Header -->
    <div>
      <slot />
    </div>

    <!-- Bar -->
    <div v-if="props.showBar" class="rounded-md h-1 bg-gray-200 mb-4">
      <div class="rounded-md h-1 bg-brand-800" style="width: 40%" />
    </div>

    <!-- Details -->
    <div class="flex flex-col gap-2.5">
      <div class="flex items-center">
        <i class="ri-checkbox-circle-fill text-green-500 text-base mr-2 h-4 flex items-center" />
        <p class="text-gray-600 text-2xs">
          6,000 issues synced
        </p>
      </div>
      <div class="flex items-center">
        <div class="flex items-center justify-center h-4 w-4 mr-2">
          <cr-spinner size="0.75rem" />
        </div>
        <p class="text-gray-600 text-2xs">
          700 out of 2,400 pull requests synced
        </p>
      </div>
      <div class="flex items-center">
        <div class="flex items-center justify-center h-4 w-4 mr-2" />
        <p class="text-gray-400 text-2xs">
          800 commits
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import CrSpinner from '@/ui-kit/spinner/Spinner.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
  showBar: {
    type: Boolean,
    default: false,
  },
});
</script>

<script>
export default {
  name: 'AppIntegrationProgress',
};
</script>
