<template>
  <slot :connect="connect" :settings="settings" :has-settings="hasSettings" :settings-component="JiraSettings" />
  <app-jira-connect-drawer v-model="drawerVisible" :integration="integration" />
</template>

<script setup>
import { computed, defineProps, ref } from 'vue';
import AppJiraConnectDrawer from '@/integrations/jira/components/jira-connect-drawer.vue';
import JiraSettings from './jira-settings.vue';

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
const hasSettings = computed(() => props.integration.settings?.url);
const settings = () => {
  drawerVisible.value = true;
};
</script>

<script>
export default {
  name: 'AppJiraConnect',
};
</script>
