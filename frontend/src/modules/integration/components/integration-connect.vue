<template>
  <app-integration-github
    v-if="integration.platform === 'github'"
    :integration="integration"
    :onboard="onboard"
  >
    <template #default="{ connect, settings, hasSettings }">
      <slot
        :connect="connect"
        :settings="settings"
        :has-settings="hasSettings"
        :connected="isConnected"
        :done="isDone"
      />
    </template>
  </app-integration-github>
  <app-integration-twitter
    v-else-if="integration.platform === 'twitter'"
    :integration="integration"
    :onboard="onboard"
  >
    <template #default="{ connect, settings, hasSettings }">
      <slot
        :connect="connect"
        :settings="settings"
        :has-settings="hasSettings"
        :connected="isConnected"
        :done="isDone"
      />
    </template>
  </app-integration-twitter>
  <app-integration-devto
    v-else-if="integration.platform === 'devto'"
    :integration="integration"
    :onboard="onboard"
  >
    <template #default="{ connect, settings, hasSettings }">
      <slot
        :connect="connect"
        :settings="settings"
        :has-settings="hasSettings"
        :connected="isConnected"
        :done="isDone"
      />
    </template>
  </app-integration-devto>
  <app-integration-discord
    v-else-if="integration.platform === 'discord'"
    :integration="integration"
    :onboard="onboard"
  >
    <template #default="{ connect, settings, hasSettings }">
      <slot
        :connect="connect"
        :settings="settings"
        :has-settings="hasSettings"
        :connected="isConnected"
        :done="isDone"
      />
    </template>
  </app-integration-discord>
  <app-integration-slack
    v-else-if="integration.platform === 'slack'"
    :integration="integration"
    :onboard="onboard"
  >
    <template #default="{ connect, settings, hasSettings }">
      <slot
        :connect="connect"
        :settings="settings"
        :has-settings="hasSettings"
        :connected="isConnected"
        :done="isDone"
      />
    </template>
  </app-integration-slack>
  <app-integration-custom
    v-else-if="
      integration.platform === 'custom' && !onboard
    "
    :integration="integration"
  ></app-integration-custom>
  <app-integration-soon
    v-else-if="!onboard"
    :integration="integration"
  />
</template>

<script>
export default {
  name: 'AppIntegrationConnect'
}
</script>
<script setup>
import { computed, defineProps } from 'vue'

import AppIntegrationGithub from './platforms/integration-github'
import AppIntegrationSlack from './platforms/integration-slack'
import AppIntegrationDiscord from './platforms/integration-discord'
import AppIntegrationTwitter from './platforms/integration-twitter'
import AppIntegrationDevto from './platforms/integration-devto'
import AppIntegrationSoon from './platforms/integration-soon'
import AppIntegrationCustom from './platforms/integration-custom'

const props = defineProps({
  onboard: {
    type: Boolean,
    default: false
  },
  integration: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const isConnected = computed(() => {
  return props.integration.status !== undefined
})

const isDone = computed(() => {
  return props.integration.status === 'done'
})
</script>
