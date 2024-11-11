<template>
  <lf-dropdown-item @click="isSettingsDrawerOpen = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-groupsio-settings-drawer
    v-if="isSettingsDrawerOpen"
    v-model="isSettingsDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfGroupsioSettingsDrawer from '@/config/integrations/groupsio/components/groupsio-settings-drawer.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isSettingsDrawerOpen = ref(false);
// const isDetailsModalOpen = ref(false);
</script>

<script>
export default {
  name: 'LfGroupsioDropdown',
};
</script>
