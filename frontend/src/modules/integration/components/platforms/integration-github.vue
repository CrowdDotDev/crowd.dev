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
import { useStore } from 'vuex'
import { defineProps, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import config from '@/config'

const store = useStore()
const router = useRouter()

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

onMounted(async () => {
  // GitHub redirects back here. This might have to be changed.
  // It is giving us a code for Oauth and and Install ID in the URL,
  // we need those things to authenticate the app and to perform the Oauth
  const code = router.currentRoute.query?.code
  const install_id =
    router.currentRoute.query?.installation_id

  // If the URL parameters are present (we have been redirected from GitHub):
  // do the authentication and the Oauth.
  const setupAction =
    router.currentRoute.query?.setup_action

  if (code) {
    await store.dispatch('integration/doGithubConnect', {
      code,
      install_id,
      setupAction
    })
  }
})
</script>
