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
        hasSettings,
        hasIntegration,
      }"
    >
      <slot
        :connect="connect"
        :settings="settings"
        :has-settings="hasSettings"
        :has-integration="hasIntegration"
        :connected="isConnected"
        :done="isDone"
      />
    </template>
  </component>
  <a
    v-else-if="props.integration.platform === 'custom'"
    href="https://crowd.dev/integration-framework"
    target="_blank"
    rel="noopener noreferrer"
    class="btn btn--primary btn--md"
  >Read more</a>
  <component
    :is="props.integration.connectComponent"
    v-else-if="props.integration.connectComponent"
    :integration="props.integration"
  />
  <el-button
    v-else
    class="btn btn--secondary btn--md"
    :disabled="true"
  >
    Soon
  </el-button>
</template>

<script setup>
import { defineProps, computed } from 'vue';

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
