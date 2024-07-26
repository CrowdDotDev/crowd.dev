<template>
  <slot :connect="connect" :settings-component="HackerNewsSettings" />
  <app-hacker-news-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import AppHackerNewsConnectDrawer from '@/integrations/hackernews/components/hackerNews-connect-drawer.vue';
import HackerNewsSettings from './hackerNews-settings.vue';

defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const drawerVisible = ref(false);
const connect = () => {
  drawerVisible.value = true;
};

</script>

<script>
export default {
  name: 'AppHackerNewsConnect',
};
</script>
