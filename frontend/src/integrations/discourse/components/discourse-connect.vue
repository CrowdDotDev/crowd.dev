<template>
  <slot :connect="connect" />
  <app-discourse-connect-drawer v-model="drawerVisible" />
</template>

<script setup>
import { ref } from 'vue';
import AppDiscourseConnectDrawer from '@/integrations/discourse/components/discourse-connect-drawer.vue';

const drawerVisible = ref(false);
const connect = () => {
  drawerVisible.value = true;
};
</script>

<script>
export default {
  name: 'AppDiscourseConnect',
};
</script>
