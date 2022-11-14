<template>
  <slot :connect="connect"></slot>
</template>

<script>
export default {
  name: 'AppGithubConnect'
}
</script>
<script setup>
import { defineProps, computed } from 'vue'
import config from '@/config'

defineProps({
  integration: {
    type: Object,
    default: () => {}
  }
})

const connect = () => {
  window.open(githubConnectUrl.value, '_self')
}

const githubConnectUrl = computed(() => {
  // We have 3 GitHub apps: test, test-local and prod
  // Getting the proper URL from config file
  return config.gitHubInstallationUrl
})
</script>
