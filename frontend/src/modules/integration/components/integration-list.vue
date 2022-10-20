<template>
  <div class="relative">
    <!--<div
      v-if="loading"
      class="absolute flex items-center justify-center grow flex-col w-full inset-0 z-10 rounded-lg mt-4"
      :style="{
        backgroundColor: 'rgba(255,255,255,0.9)'
      }"
    >
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner w-20"
      ></div>
      <span>
        Finishing the integration setup, please don't reload
        the page.
      </span>
    </div>-->
    <div class="grid grid-cols-3 grid-rows-4 gap-4">
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

import AppIntegrationGithub from './integration-github'
import AppIntegrationSlack from './integration-slack'
import AppIntegrationDiscord from './integration-discord'
import AppIntegrationTwitter from './integration-twitter'
import AppIntegrationDevto from './integration-devto'
import AppIntegrationSoon from './integration-soon'
import AppIntegrationCustom from './integration-custom'
import integrationsJsonArray from '@/jsons/integrations.json'

const store = useStore()
const props = defineProps({
  onboard: {
    type: Boolean,
    default: false
  }
})

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
  await store.dispatch('integration/doFetch')
})
</script>
