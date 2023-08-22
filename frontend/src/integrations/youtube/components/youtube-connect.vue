<template>
  <slot :connect="connect" />
  <app-youtube-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import AppYoutubeConnectDrawer from '@/integrations/youtube/components/youtube-connect-drawer.vue';

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
  name: 'AppYoutubeConnect',
};
</script>
