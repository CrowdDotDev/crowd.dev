<template>
  <slot :connect="connect" :settings="settings" :has-settings="hasSettings" />
  <app-groupsio-connect-drawer v-model="drawerVisible" :integration="integration" />
</template>

<script setup>
import { computed, ref } from 'vue';
import AppGroupsioConnectDrawer from '@/integrations/groupsio/components/groupsio-connect-drawer.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => { },
  },
});
const drawerVisible = ref(false);
const connect = () => {
  drawerVisible.value = true;
};
// eslint-disable-next-line no-undef
const hasSettings = computed(
  () => props.integration.settings?.email,
);
const settings = () => {
  drawerVisible.value = true;
};
</script>
<script>
export default {
  name: 'AppGroupsioConnect',
};
</script>
