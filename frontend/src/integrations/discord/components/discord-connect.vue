<template>
  <slot
    :connect="connect"
    :settings="settings"
    :has-settings="hasSettings"
    :settings-component="DiscordSettings"
  />
</template>

<script setup>
import { defineProps, computed } from 'vue';
import config from '@/config';
import DiscordSettings from './discord-settings.vue';

defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const connectUrl = computed(() => config.discordInstallationUrl);

const connect = () => {
  window.open(connectUrl.value, '_self');
};

// eslint-disable-next-line no-undef
const hasSettings = computed(() => true);
const settings = () => {
  drawerVisible.value = true;
};
</script>

<script>
export default {
  name: 'AppIntegrationDiscord',
};
</script>
