<!-- Grid layout for medium and large screens -->
<template>
  <div
    class="gap-x-4 px-6 grid md:grid-cols-6 lg:container lg:grid-cols-12 lg:px-8 pt-1 pb-24"
  >
    <div :class="containerClass"><slot></slot></div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  containerClass: {
    type: String,
    default: 'col-start-1 col-end-13'
  }
})
</script>
