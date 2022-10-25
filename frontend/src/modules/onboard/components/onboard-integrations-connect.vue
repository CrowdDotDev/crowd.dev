<template>
  <app-integration-connect :integration="integration">
    <template
      #default="{
        connect,
        connected,
        done,
        hasSettings,
        settings
      }"
    >
      <div class="flex items-center">
        <button
          v-if="!connected"
          class="btn btn--md btn--secondary"
          @click="connect"
        >
          Connect
        </button>
        <div v-else class="flex items-center">
          <span v-if="done" class="badge badge--green"
            >Connected</span
          >
          <div v-else class="flex items-center">
            <div
              v-loading="true"
              class="app-page-spinner flex items-center justify-center h-4 w-4 !relative !min-h-4"
            ></div>
            <span class="text-xs leading-5 ml-2"
              >In progress</span
            >
          </div>
        </div>
        <div
          v-if="hasSettings && connected"
          class="ml-3 h-8 w-8 flex items-center justify-center"
          @click="settings"
        >
          <span
            class="ri-settings-3-line text-lg text-gray-600"
          ></span>
        </div>
      </div>
    </template>
  </app-integration-connect>
</template>

<script>
import AppIntegrationConnect from '@/modules/integration/components/integration-connect'

export default {
  name: 'AppOnboardIntegrationsConnect',
  components: { AppIntegrationConnect },
  props: {
    integration: {
      type: Object,
      required: true
    }
  }
}
</script>
