<template>
  <div class="relative">
    <div
      v-if="loading"
      class="flex items-center justify-center"
    >
      <div
        v-loading="loading"
        class="app-page-spinner w-20"
      ></div>
    </div>
    <div v-else class="grid grid-cols-3 grid-rows-4 gap-4">
      <div
        v-for="integration in integrationsArray"
        :key="integration.platform"
      >
        <app-integration-github
          v-if="integration.platform === 'github'"
          :integration="integration"
          :onboard="onboard"
        />
        <app-integration-twitter
          v-else-if="integration.platform === 'twitter'"
          :integration="integration"
          :onboard="onboard"
        />
        <app-integration-devto
          v-else-if="integration.platform === 'devto'"
          :integration="integration"
          :onboard="onboard"
        />
        <app-integration-discord
          v-else-if="integration.platform === 'discord'"
          :integration="integration"
          :onboard="onboard"
        />
        <app-integration-slack
          v-else-if="integration.platform === 'slack'"
          :integration="integration"
          :onboard="onboard"
        />
        <app-integration-custom
          v-else-if="
            integration.platform === 'custom' && !onboard
          "
          :integration="integration"
        />
        <app-integration-soon
          v-else-if="!onboard"
          :integration="integration"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppIntegrationsList'
}
</script>
<script setup>
import { useStore } from 'vuex'
import { defineProps, computed, onMounted } from 'vue'

import AppIntegrationGithub from './platforms/integration-github'
import AppIntegrationSlack from './platforms/integration-slack'
import AppIntegrationDiscord from './platforms/integration-discord'
import AppIntegrationTwitter from './platforms/integration-twitter'
import AppIntegrationDevto from './platforms/integration-devto'
import AppIntegrationSoon from './platforms/integration-soon'
import AppIntegrationCustom from './platforms/integration-custom'
import integrationsJsonArray from '@/jsons/integrations.json'

const store = useStore()
const props = defineProps({
  onboard: {
    type: Boolean,
    default: false
  }
})

const loading = computed(
  () => store.getters['integration/loadingFetch']
)
const integrationsArray = computed(() => {
  return props.onboard
    ? integrationsJsonArray
        .filter((i) =>
          [
            'github',
            'slack',
            'discord',
            'twitter',
            'devto'
          ].includes(i.platform)
        )
        .map(mapper)
    : integrationsJsonArray.map(mapper)
})

const mapper = (integration) => {
  return {
    ...integration,
    ...store.getters['integration/findByPlatform'](
      integration.platform
    )
  }
}

onMounted(async () => {
  if (store.state.integration.count === 0) {
    await store.dispatch('integration/doFetch')
  }

  const params = new URLSearchParams(window.location.search)
  // GitHub redirects back here. This might have to be changed.
  // It is giving us a code for Oauth and and Install ID in the URL,
  // we need those things to authenticate the app and to perform the Oauth
  const code = params.get('code')
  const install_id = params.get('installation_id')

  // If the URL parameters are present (we have been redirected from GitHub):
  // do the authentication and the Oauth.
  const setupAction = params.get('setup_action')

  // Get the source. If none we use GitHub.
  const source = params.get('source')

  if (code) {
    if (source === 'discord') {
      await store.dispatch('integration/doDiscordConnect', {
        guildId: params.get('guild_id')
      })
    } else {
      await store.dispatch('integration/doGithubConnect', {
        code,
        install_id,
        setupAction
      })
    }
  }
})
</script>
