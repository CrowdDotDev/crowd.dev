<template>
  <slot
    :connect="connect"
    :settings="settings"
    :has-settings="hasSettings"
    :settings-component="StackOverflowSettings"
  />
  <app-stack-overflow-connect-drawer
    v-model="drawerVisible"
    :integration="integration"
  />
</template>

<script setup>
import { computed, defineProps, ref } from 'vue';
import AppStackOverflowConnectDrawer from '@/integrations/stackoverflow/components/stackoverflow-connect-drawer.vue';
import StackOverflowSettings from './stackoverflow-settings.vue';

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
  name: 'AppStackOverflowConnect',
};
</script>
