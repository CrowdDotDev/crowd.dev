<template>
  <app-svg
    :class="svgClass"
    color="#D1D5DB"
    :name="platform"
    :hover-color="asLink ? '#4B5563' : ''"
  />
</template>

<script setup lang="ts">
import AppSvg from '@/shared/svg/svg.vue';
import { computed } from 'vue';

const props = defineProps<{
    platform: string;
    size: string;
    asLink: boolean;
}>();

const svgClass = computed(() => {
  if (props.size === 'large') {
    return 'max-w-[20px] h-5';
  }

  return 'max-w-[16px] h-4';
});
</script>

<script lang="ts">
export default {
  name: 'AppPlatformSvg',
};
</script>
