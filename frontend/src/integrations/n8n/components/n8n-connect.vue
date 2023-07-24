<template>
  <slot :connect="connect" />
  <app-n8n-connect-drawer v-model="drawerVisible" />
</template>

<script setup>
import { ref } from 'vue';
import AppN8nConnectDrawer from '@/integrations/n8n/components/n8n-connect-drawer.vue';

const drawerVisible = ref(false);
const connect = () => {
  drawerVisible.value = true;
};
</script>

<script>
export default {
  name: 'AppN8nConnect',
};
</script>
