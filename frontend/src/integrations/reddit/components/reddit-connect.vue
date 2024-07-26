<template>
  <slot
    :connect="connect"
    :settings="settings"
    :has-settings="hasSettings"
    :settings-component="RedditSettings"
  />
  <app-reddit-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script setup>
import { computed, defineProps, ref } from 'vue';
import AppRedditConnectDrawer from '@/integrations/reddit/components/reddit-connect-drawer.vue';
import RedditSettings from './reddit-settings.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});
const drawerVisible = ref(false);

// Only render twitter drawer and settings button, if integration has settings
const hasSettings = computed(
  () => !!props.integration.settings,
);
const settings = () => {
  drawerVisible.value = true;
};

async function connect() {
  drawerVisible.value = true;
}
</script>

<script>
export default {
  name: 'AppRedditConnect',
};
</script>
