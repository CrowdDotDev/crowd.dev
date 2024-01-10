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
    class="btn btn-brand btn-brand--primary btn--md"
  >Read more</a>
  <component
    :is="props.integration.connectComponent"
    v-else-if="props.integration.connectComponent"
    :integration="props.integration"
  />
  <el-button
    v-else-if="props.integration.enterprise"
    class="btn btn--secondary btn--md"
    @click="bookADemo"
  >
    Book a call
  </el-button>
  <el-button
    v-else
    class="btn btn--secondary btn--md"
    :disabled="true"
  >
    Soon
  </el-button>

  <app-dialog
    v-model="isCalDialogOpen"
    size="2extra-large"
  >
    <template #content>
      <div id="embbeded-script" class="w-full px-3 pb-3 min-h-20" />
    </template>
  </app-dialog>
</template>

<script setup>
import { defineProps, computed, ref } from 'vue';
import { renderCal } from '@/utils/cals';

const props = defineProps({
  integration: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

const isCalDialogOpen = ref();

const isConnected = computed(() => props.integration.status !== undefined);

const isDone = computed(() => props.integration.status === 'done');

const bookADemo = () => {
  isCalDialogOpen.value = true;
  setTimeout(() => {
    renderCal({
      calLink: 'team/CrowdDotDev/sales',
    });
  }, 0);
};
</script>

<script>
export default {
  name: 'AppIntegrationConnect',
};
</script>
