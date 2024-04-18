<template>
  <div class="flex items-center gap-1" :class="style.color">
    <app-svg :name="style.svg" class="h-5 w-5" />
    <p class="text-xs leading-5 whitespace-nowrap">
      {{ percentage }}% confidence
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppSvg from '@/shared/svg/svg.vue';

const props = defineProps<{
  similarity: number
}>();

const percentage = computed(() => Math.ceil(props.similarity * 100));

const style = computed<{
  color: string,
  svg: string
}>(() => {
  if (props.similarity >= 0.8) {
    return {
      color: 'text-green-600',
      svg: 'similarity-high',
    };
  }
  if (props.similarity >= 0.6) {
    return {
      color: 'text-blue-500',
      svg: 'similarity-medium',
    };
  }
  return {
    color: 'text-yellow-600',
    svg: 'similarity-low',
  };
});
</script>

<script lang="ts">
export default {
  name: 'AppMemberMergeSimilarity',
};
</script>
