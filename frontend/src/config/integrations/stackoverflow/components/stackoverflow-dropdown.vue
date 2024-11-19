<template>
  <lf-dropdown-item @click="isStackoverflowConnectDrawerOpen = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-stackoverflow-settings-drawer
    v-if="isStackoverflowConnectDrawerOpen"
    v-model="isStackoverflowConnectDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfStackoverflowSettingsDrawer
  from '@/config/integrations/stackoverflow/components/stackoverflow-settings-drawer.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isStackoverflowConnectDrawerOpen = ref(false);
</script>

<script>
export default {
  name: 'LfGitDropdown',
};
</script>
