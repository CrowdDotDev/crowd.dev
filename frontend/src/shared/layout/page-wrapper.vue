<!-- Grid layout for medium and large screens -->
<template>
  <div class="flex flex-col justify-center items-center">
    <div
      class="w-full gap-x-4 px-6 py-1 grid grid-cols-12 lg:gap-x-5 lg:px-8"
      :class="computedClass"
    >
      <div :class="containerClass">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  size: {
    type: String,
    default: 'default',
  },
  containerClass: {
    type: String,
    default: 'col-start-1 col-end-13',
  },
});

const computedClass = computed(() => {
  if (props.size === 'default') {
    return 'max-w-6xl';
  } if (props.size === 'narrow') {
    return 'max-w-5xl';
  } if (props.size === 'full-width') {
    return 'max-w-full';
  }
  return '';
});
</script>
