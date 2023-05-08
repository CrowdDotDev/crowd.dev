<template>
  <slot :connect="connect" />
  <app-git-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import AppGitConnectDrawer from '@/integrations/git/components/git-connect-drawer.vue';

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
  name: 'AppGitConnect',
};
</script>
