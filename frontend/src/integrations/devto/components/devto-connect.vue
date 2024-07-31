<template>
  <slot :connect="connect" :settings-component="DevtoSettings" />
  <app-devto-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import AppDevtoConnectDrawer from '@/integrations/devto/components/devto-connect-drawer.vue';
import DevtoSettings from './devto-settings.vue';

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
  name: 'AppDevtoConnect',
};
</script>
