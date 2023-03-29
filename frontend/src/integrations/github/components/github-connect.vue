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

// We have 3 GitHub apps: test, test-local and prod
// Getting the proper URL from config file
const githubConnectUrl = computed(() => config.gitHubInstallationUrl);
const connect = () => {
  window.open(githubConnectUrl.value, '_self');
};

</script>

<script>
export default {
  name: 'AppGithubConnect',
};
</script>
