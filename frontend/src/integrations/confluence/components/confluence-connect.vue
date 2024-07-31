<template>
  <slot :connect="connect" :settings="settings" :has-settings="hasSettings" :settings-component="ConfluenceSettings" />
  <app-confluence-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script setup>
import { computed, defineProps, ref } from 'vue';
import AppConfluenceConnectDrawer from '@/integrations/confluence/components/confluence-connect-drawer.vue';
import ConfluenceSettings from './confluence-settings.vue';

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
  () => props.integration.settings,
);
const settings = () => {
  drawerVisible.value = true;
};
</script>

<script>
export default {
  name: 'AppConfluenceConnect',
};
</script>
