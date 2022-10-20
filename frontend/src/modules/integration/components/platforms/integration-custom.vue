<template>
  <app-integration-list-item
    :integration="integration"
    class="integration-custom"
  >
    <template #connect>
      <a
        href="https://docs.crowd.dev/v0/reference/"
        target="_blank"
        class="btn btn-brand btn-brand--primary btn--md"
        >Read more</a
      >
    </template>
  </app-integration-list-item>
</template>

<script setup>
import AppIntegrationListItem from '../integration-list-item'
import { defineProps } from 'vue'

defineProps({
  integration: {
    type: Object,
    default: () => {}
  }
})
</script>

<style lang="scss">
.integration-custom {
  background: linear-gradient(
      117.72deg,
      #fdedea 0%,
      rgba(253, 237, 234, 0) 100%
    ),
    #ffffff;
}
</style>
