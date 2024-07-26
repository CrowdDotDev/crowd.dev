<template>
  <slot :connect="connect" :settings="settings" :has-settings="hasSettings" :settings-component="GerritSettings" />
  <app-gerrit-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script setup>
import { computed, defineProps, ref } from 'vue';
import AppGerritConnectDrawer from '@/integrations/gerrit/components/gerrit-connect-drawer.vue';
import GerritSettings from './gerrit-settings.vue';

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
  () => props.integration.settings?.remote.orgURL,
);
const settings = () => {
  drawerVisible.value = true;
};
</script>

<script>
export default {
  name: 'AppGerritConnect',
};
</script>
