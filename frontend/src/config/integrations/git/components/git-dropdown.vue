<template>
  <lf-dropdown-item @click="isGitConnectDrawerOpen = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-git-settings-drawer
    v-model="isGitConnectDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfGitSettingsDrawer from '@/config/integrations/git/components/git-settings-drawer.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isGitConnectDrawerOpen = ref(false);
// const isDetailsModalOpen = ref(false);
</script>

<script>
export default {
  name: 'AppGitConnect',
};
</script>
