<template>
  <lf-dropdown-item @click="isConfluenceSettingsDrawerVisible = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-confluence-settings-drawer
    v-if="isConfluenceSettingsDrawerVisible"
    v-model="isConfluenceSettingsDrawerVisible"
    :integration="props.integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfConfluenceSettingsDrawer from '@/config/integrations/confluence/components/confluence-settings-drawer.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isConfluenceSettingsDrawerVisible = ref(false);
// const isDetailsModalOpen = ref(false);
</script>

<script>
export default {
  name: 'AppGitConnect',
};
</script>
