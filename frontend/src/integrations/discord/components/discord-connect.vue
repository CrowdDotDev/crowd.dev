<template>
  <slot :connect="connect"></slot>
</template>

<script>
export default {
  name: 'AppIntegrationDiscord'
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
  window.open(connectUrl.value, '_self')
}

const connectUrl = computed(() => {
  return config.discordInstallationUrl
})
</script>
