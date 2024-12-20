<template>
  <lf-dropdown-item @click="isStackoverflowConnectDrawerOpen = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-stackoverflow-settings-drawer
    v-if="isStackoverflowConnectDrawerOpen"
    v-model="isStackoverflowConnectDrawerOpen"
    :integration="props.integration"
    :segment-id="props.segmentId"
    :grandparent-id="props.grandparentId"
  />
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfStackoverflowSettingsDrawer
  from '@/config/integrations/stackoverflow/components/stackoverflow-settings-drawer.vue';

const props = defineProps<{
  integration: any,
  segmentId?: string,
  grandparentId?: string,
}>();

const isStackoverflowConnectDrawerOpen = ref(false);
</script>

<script lang="ts">
export default {
  name: 'LfGitDropdown',
};
</script>
