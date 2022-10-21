<template>
  <app-integration-list-item
    :integration="integration"
    :onboard="onboard"
  >
    <template #connect>
      <a
        class="btn btn--secondary btn--md"
        :href="githubConnectUrl"
        >Connect</a
      >
    </template>
  </app-integration-list-item>
</template>

<script>
export default {
  name: 'AppIntegrationGithub'
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

const githubConnectUrl = computed(() => {
  // We have 3 GitHub apps: test, test-local and prod
  // Getting the proper URL from config file
  return config.gitHubInstallationUrl
})
</script>
