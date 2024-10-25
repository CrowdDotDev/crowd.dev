<template>
  <i :class="`ri-${props.name}`" :style="sizeStyle" class="flex items-center c-icon" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  name: string,
  size?: number,
}>();

const sizeStyle = computed(() => {
  if (!props.size) {
    return undefined;
  }
  return {
    fontSize: `${props.size / 16}rem`,
    height: `${props.size / 16}rem`,
  };
});
</script>

<script lang="ts">
export default {
  name: 'LfIconOld',
};
</script>
