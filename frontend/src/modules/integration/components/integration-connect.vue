<template>
  <component
    :is="props.integration.connectComponent"
    v-if="
      props.integration.enabled
        && props.integration.connectComponent
    "
    :integration="props.integration"
  >
    <template
      #default="{
        connect,
        settings,
        settingsComponent,
        hasSettings,
        hasIntegration,
      }"
    >
      <slot
        :connect="connect"
        :settings="settings"
        :settings-component="settingsComponent"
        :has-settings="hasSettings"
        :has-integration="hasIntegration"
        :connected="isConnected"
        :done="isDone"
      />
    </template>
  </component>
  <component
    :is="props.integration.connectComponent"
    v-else-if="props.integration.connectComponent"
    :integration="props.integration"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  integration: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

const isConnected = computed(() => props.integration.status !== undefined);

const isDone = computed(() => props.integration.status === 'done');
</script>

<script>
export default {
  name: 'AppIntegrationConnect',
};
</script>
