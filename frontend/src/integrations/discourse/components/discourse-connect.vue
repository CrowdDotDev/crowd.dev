<template>
  <slot :connect="connect" :settings="settings" :has-settings="hasSettings" />
  <app-discourse-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script setup>
import { computed, defineProps, ref } from 'vue';
import AppDiscourseConnectDrawer from '@/integrations/discourse/components/discourse-connect-drawer.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const drawerVisible = ref(false);

const connect = () => {
  drawerVisible.value = true;
};

// eslint-disable-next-line no-undef
const hasSettings = computed(
  () => props.integration.settings?.forumHostname,
);
const settings = () => {
  drawerVisible.value = true;
};
</script>

<script>
export default {
  name: 'AppDiscourseConnect',
};
</script>
