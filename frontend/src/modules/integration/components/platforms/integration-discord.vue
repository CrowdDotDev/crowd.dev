<template>
  <app-integration-list-item
    :integration="integration"
    :onboard="onboard"
  >
    <template #connect>
      <a
        class="btn btn--secondary btn--md"
        :href="connectUrl"
        >Connect</a
      >
    </template>
  </app-integration-list-item>
</template>

<script>
export default {
  name: 'AppIntegrationDiscord'
}
</script>
<script setup>
import AppIntegrationListItem from '../integration-list-item'
import { defineProps, computed } from 'vue'
import config from '@/config'

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

const connectUrl = computed(() => {
  return config.discordInstallationUrl
})
</script>
