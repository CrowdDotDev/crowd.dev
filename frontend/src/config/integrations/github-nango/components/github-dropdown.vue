<template>
  <lf-dropdown-item @click="isGitHubSettingsDrawerOpen = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-github-settings-drawer
    v-if="isGitHubSettingsDrawerOpen"
    v-model="isGitHubSettingsDrawerOpen"
    :integration="props.integration"
    :segment-id="props.segmentId"
    :grandparent-id="props.grandparentId"
  />
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfGithubSettingsDrawer from '@/config/integrations/github-nango/components/settings/github-settings-drawer.vue';

const props = defineProps<{
  integration: any;
  segmentId: string | null;
  grandparentId: string | null;
}>();

const isGitHubSettingsDrawerOpen = ref(false);
</script>

<script lang="ts">
export default {
  name: 'LfGitHubDropdown',
};
</script>
