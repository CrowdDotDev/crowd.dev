<template>
  <app-integration-list-item :integration="integration">
    <template #connect>
      <el-button
        class="btn btn--bordered btn--md"
        :disabled="true"
        >Soon</el-button
      >
    </template>
  </app-integration-list-item>
</template>

<script>
export default {
  name: 'AppIntegrationSoon'
}
</script>
<script setup>
import AppIntegrationListItem from './integration-list-item'
import { defineProps } from 'vue'

defineProps({
  integration: {
    type: Object,
    default: () => {}
  }
})
</script>
