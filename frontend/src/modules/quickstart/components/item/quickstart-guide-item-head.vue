<template>
  <div class="flex">
    <div class="pr-3">
      <i
        class="ri-checkbox-circle-fill text-xl flex items-center h-6 font-normal"
        :class="props.guide.completed ? 'text-green-500' : 'text-gray-300'"
      />
    </div>
    <div>
      <h4 class="text-sm font-semibold leading-6 mb-1.5">
        {{ props.guide.title }}
      </h4>
      <p class="text-xs text-gray-500 font-normal">
        {{ props.guide.body }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { QuickstartGuide } from '@/modules/quickstart/types/QuickstartGuide';

const props = defineProps<{
  guide: QuickstartGuide
}>();
</script>

<script lang="ts">
export default {
  name: 'CrQuickstartGuideItemHead',
};
</script>
