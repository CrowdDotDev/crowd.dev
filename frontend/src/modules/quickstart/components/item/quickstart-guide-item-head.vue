<template>
  <div class="flex justify-between flex-grow">
    <div class="pr-3">
      <i
        class="ri-checkbox-circle-fill text-xl flex items-center h-6 font-normal"
        :class="props.guide.completed ? 'text-green-500' : 'text-gray-300'"
      />
    </div>
    <div class="flex-grow w-full">
      <h4 class="text-sm font-semibold leading-6 mb-1.5">
        {{ props.guide.title }}
      </h4>
      <div class="w-full">
        <p class="text-xs text-gray-500 font-normal" :class="props.extended ? '' : 'h-5 truncate whitespace-wrap'">
          {{ props.guide.body }}
        </p>
      </div>
    </div>
    <div class="pl-8">
      <div class="h-5 transition-all" :class="props.extended ? 'rotate-180' : ''">
        <i
          class="ri-arrow-down-s-line text-lg text-gray-400"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { QuickstartGuide } from '@/modules/quickstart/types/QuickstartGuide';

const props = defineProps<{
  guide: QuickstartGuide,
  extended: boolean,
}>();
</script>

<script lang="ts">
export default {
  name: 'CrQuickstartGuideItemHead',
};
</script>
