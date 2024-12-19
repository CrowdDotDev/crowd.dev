<template>
  <lf-dropdown-item @click="isRedditSettingsDrawerOpen = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-reddit-settings-drawer
    v-if="isRedditSettingsDrawerOpen"
    v-model="isRedditSettingsDrawerOpen"
    :integration="props.integration"
    :segment-id="props.segmentId"
    :grandparent-id="props.grandparentId"
  />
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfRedditSettingsDrawer from '@/config/integrations/reddit/components/reddit-settings-drawer.vue';

const props = defineProps<{
  integration: any,
  segmentId: string,
  grandparentId: string,
}>();

const isRedditSettingsDrawerOpen = ref(false);
</script>

<script lang="ts">
export default {
  name: 'LfRedditDropdown',
};
</script>
