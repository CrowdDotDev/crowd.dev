<!-- Grid layout for medium and large screens -->
<template>
  <div
    class="gap-x-4 px-6 pt-1 pb-24 grid grid-cols-12 lg:gap-x-5 lg:px-8"
    :class="computedClass"
  >
    <div :class="containerClass"><slot></slot></div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'default'
  },
  containerClass: {
    type: String,
    default: 'col-start-1 col-end-13'
  }
})

const computedClass = computed(() => {
  if (props.size === 'default') {
    return 'max-w-6xl mx-auto'
  } else if (props.size === 'narrow') {
    return 'max-w-5xl mx-auto'
  } else if (props.size === 'full-width') {
    return 'max-w-full mx-auto'
  } else {
    return ''
  }
})
</script>
