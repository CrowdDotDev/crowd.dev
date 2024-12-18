<template>
  <lf-button v-if="isPendingAction" type="secondary" @click="isLinkedinSettingsDrawerOpen = true">
    Settings
  </lf-button>
  <lf-linkedin-settings-drawer
    v-if="isLinkedinSettingsDrawerOpen"
    v-model="isLinkedinSettingsDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup>
import {
  computed,
  defineProps,
  ref,
} from 'vue';
import LfLinkedinSettingsDrawer from '@/config/integrations/linkedin/components/linkedin-settings-drawer.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isPendingAction = computed(() => props.integration.status === 'pending-action');

const isLinkedinSettingsDrawerOpen = ref(isPendingAction.value);
</script>

<script>
export default {
  name: 'LfLinkedinAction',
};
</script>
