<template>
  <app-integration-list-item
    :integration="integration"
    :onboard="onboard"
  >
    <template #connect>
      <el-button
        class="btn btn--secondary btn--md"
        @click="drawerVisible = true"
        >Connect</el-button
      >
      <app-integration-devto-drawer
        v-model="drawerVisible"
        :integration="integration"
      />
    </template>
  </app-integration-list-item>
</template>

<script>
export default {
  name: 'AppIntegrationDevto'
}
</script>
<script setup>
import AppIntegrationListItem from '../integration-list-item'
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

const drawerVisible = ref(false)
</script>
