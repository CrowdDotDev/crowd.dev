<template>
  <lf-dropdown-item @click="isLinkedinConnectDrawerOpen = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-linkedin-settings-drawer
    v-if="isLinkedinConnectDrawerOpen"
    v-model="isLinkedinConnectDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfLinkedinSettingsDrawer from '@/config/integrations/linkedin/components/linkedin-settings-drawer.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isLinkedinConnectDrawerOpen = ref(false);
</script>

<script>
export default {
  name: 'LfLinkedinDropdown',
};
</script>
