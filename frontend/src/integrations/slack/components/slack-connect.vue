<template>
  <slot :connect="connect"></slot>
</template>

<script>
export default {
  name: 'AppSlackConnect'
}
</script>
<script setup>
import { useStore } from 'vuex'
import { defineProps, computed } from 'vue'
import config from '@/config'
import { AuthToken } from '@/modules/auth/auth-token'

const store = useStore()
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
  let currentUrl
  if (
    window.location.protocol === 'http:' &&
    window.location.host.includes('localhost')
  ) {
    currentUrl = 'https://localhost/settings'
  } else {
    currentUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
  }

  const redirectUrl = currentUrl

  return `${config.backendUrl}/slack/${
    store.getters['auth/currentTenant'].id
  }/connect?redirectUrl=${redirectUrl}&crowdToken=${AuthToken.get()}`
})
</script>
