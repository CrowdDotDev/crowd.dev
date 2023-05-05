<template>
  <div :class="classes.container">
    <div :class="classes.content">
      <i
        class="ri-error-warning-line text-gray-200"
        :class="classes.iconSize"
      />
      <div>
        <div class="text-gray-600 text-sm font-semibold">
          Something went wrong
        </div>
        <div class="text-gray-400 text-2xs font-semibold">
          Please try to reload the page
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'chart',
  },
});

const classes = computed(() => {
  if (props.type === 'kpi') {
    return {
      container: 'flex items-center',
      content: 'flex items-center gap-4',
      iconSize: 'text-3xl',
    };
  }

  return {
    container:
      'min-h-88 py-12 flex items-center justify-center',
    content: 'text-center',
    iconSize: 'text-5xl',
  };
});
</script>
