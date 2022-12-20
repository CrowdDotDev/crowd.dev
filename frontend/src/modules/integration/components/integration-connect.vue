<template>
  <component
    :is="props.integration.connectComponent"
    v-if="
      props.integration.enabled &&
      props.integration.connectComponent
    "
    :integration="props.integration"
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
  </component>
  <a
    v-else-if="props.integration.platform === 'custom'"
    href="https://crowd.dev/integration-framework"
    target="_blank"
    class="btn btn-brand btn-brand--primary btn--md"
    >Read more</a
  >
  <el-button
    v-else
    class="btn btn--bordered btn--md"
    :disabled="true"
    >Soon</el-button
  >
</template>

<script>
export default {
  name: 'AppIntegrationConnect'
}
</script>
<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
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
