<template>
  <slot :connect="connect" />
  <app-integration-devto-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script>
export default {
  name: 'AppIntegrationDevto'
}
</script>
<script setup>
import AppIntegrationDevtoDrawer from './integration-devto-drawer'
import { defineProps, ref } from 'vue'

defineProps({
  integration: {
    type: Object,
    default: () => {}
  },
  onboard: {
    type: Boolean,
    default: false
  }
})

const connect = () => {
  drawerVisible.value = true
}

const drawerVisible = ref(false)
</script>
