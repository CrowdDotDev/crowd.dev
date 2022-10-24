<template>
  <a
    href="https://docs.crowd.dev/v0/reference/"
    target="_blank"
    class="btn btn-brand btn-brand--primary btn--md"
    >Read more</a
  >
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  integration: {
    type: Object,
    default: () => {}
  }
})
</script>
