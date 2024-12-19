<template>
  <lf-dropdown-item @click="isGitConnectDrawerOpen = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-git-settings-drawer
    v-model="isGitConnectDrawerOpen"
    :integration="props.integration"
    :segment-id="props.segmentId"
    :grandparent-id="props.grandparentId"
  />
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue';
import LfGitSettingsDrawer from '@/config/integrations/git/components/git-settings-drawer.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  integration: any,
  segmentId?: string;
  grandparentId?: string;
}>();

const isGitConnectDrawerOpen = ref(false);
// const isDetailsModalOpen = ref(false);
</script>

<script lang="ts">
export default {
  name: 'LfGitDropdown',
};
</script>
