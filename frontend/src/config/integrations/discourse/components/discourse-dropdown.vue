<template>
  <lf-dropdown-item @click="isDiscourseConnectDrawerOpen = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-discourse-settings-drawer
    v-if="isDiscourseConnectDrawerOpen"
    v-model="isDiscourseConnectDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfDiscourseSettingsDrawer from '@/config/integrations/discourse/components/discourse-settings-drawer.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isDiscourseConnectDrawerOpen = ref(false);
</script>

<script>
export default {
  name: 'LfDiscourseDropdown',
};
</script>
