<template>
  <slot :connect="connect" />
</template>

<script setup>
import { defineProps, computed } from 'vue';
import config from '@/config';

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
</script>

<script>
export default {
  name: 'AppIntegrationDiscord',
};
</script>
