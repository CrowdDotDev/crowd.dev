<template>
  <app-integration-list-item
    :integration="integration"
    :onboard="onboard"
    @hashtags-changed="handleHashtagsChanged"
  >
    <template #connect>
      <a
        class="btn btn--secondary btn--md"
        :href="connectUrl"
        >Connect</a
      >
    </template>
    <template #settings>
      <el-button
        v-if="isConnected"
        class="btn btn--transparent btn--md"
        @click="drawerVisible = true"
        ><i class="ri-settings-2-line mr-2"></i
        >Settings</el-button
      >
      <app-integration-twitter-drawer
        v-model="drawerVisible"
        :hashtags="hashtags"
        :connect-url="connectUrl"
        :integration="integration"
      />
    </template>
  </app-integration-list-item>
</template>

<script>
export default {
  name: 'AppIntegrationTwitter'
}
</script>
<script setup>
import { useStore } from 'vuex'
import { defineProps, computed, ref } from 'vue'
import config from '@/config'
import { AuthToken } from '@/modules/auth/auth-token'
import AppIntegrationListItem from '../integration-list-item'
import AppIntegrationTwitterDrawer from './integration-twitter-drawer'

const props = defineProps({
  integration: {
    type: Object,
    default: () => {}
  },
  onboard: {
    type: Boolean,
    default: false
  }
})
const store = useStore()
const drawerVisible = ref(false)
const hashtags = computed(() => {
  return props.integration.settings?.hashtags || []
})

const hasHashtags = computed(
  () => hashtags.value.length > 0
)
const connectUrl = computed(() => {
  const redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`

  const encodedHashtags = hasHashtags.value
    ? '&' + hashtags.value.map((t) => `hashtags[]=${t}`)
    : ''

  return `${config.backendUrl}/twitter/${
    store.getters['auth/currentTenant'].id
  }/connect?redirectUrl=${redirectUrl}${encodedHashtags}&crowdToken=${AuthToken.get()}`
})

const isConnected = computed(() => {
  return props.integration.status !== undefined
})
</script>
