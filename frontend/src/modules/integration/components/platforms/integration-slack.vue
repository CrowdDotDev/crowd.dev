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
  name: 'AppIntegrationSlack'
}
</script>
<script setup>
import AppIntegrationListItem from '../integration-list-item'
import { useStore } from 'vuex'
import { defineProps, computed } from 'vue'
import config from '@/config'
import { AuthToken } from '@/modules/auth/auth-token'

const store = useStore()
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
  let currentUrl
  if (
    window.location.protocol === 'http:' &&
    window.location.host.includes('localhost')
  ) {
    currentUrl = 'https://localhost/settings'
  } else {
    currentUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
  }

  const redirectUrl = currentUrl.includes('integrations')
    ? currentUrl
    : `${currentUrl}?activeTab=integrations`

  return `${config.backendUrl}/slack/${
    store.getters['auth/currentTenant'].id
  }/connect?redirectUrl=${redirectUrl}&crowdToken=${AuthToken.get()}`
})
</script>
