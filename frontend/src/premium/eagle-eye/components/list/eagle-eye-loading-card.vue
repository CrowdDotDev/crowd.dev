<template>
  <div class="bg-gray-100 rounded-lg p-5">
    <div
      class="w-6 h-6 rounded-full bg-gray-200 mb-8 animate-pulse"
    />

    <div class="mb-5 flex flex-col gap-2">
      <div
        v-for="(_, index) in Array(tiles.title)"
        :key="index"
        class="bg-gray-200 h-5 w-10/12 last:w-9/12 rounded animate-pulse"
      />
    </div>
    <div class="mb-10 flex flex-col gap-3">
      <div
        v-for="(_, index) in Array(tiles.description)"
        :key="index"
        class="bg-gray-200 h-3 w-full last:w-11/12 rounded animate-pulse"
      />
    </div>
  </div>
</template>
<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  size: {
    type: String,
    default: 'small',
  },
});
const tiles = computed(() => {
  if (props.size === 'small') {
    return { title: 2, description: 3 };
  }
  return { title: 3, description: 4 };
});
</script>
