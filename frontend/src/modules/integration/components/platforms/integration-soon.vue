<template>
  <el-button
    class="btn btn--bordered btn--md"
    :disabled="true"
    >Soon</el-button
  >
</template>

<script>
export default {
  name: 'AppIntegrationSoon'
}
</script>
<script setup>
import { defineProps } from 'vue'

defineProps({
  integration: {
    type: Object,
    default: () => {}
  }
})
</script>
