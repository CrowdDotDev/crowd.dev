<template>
  <lf-dropdown-item @click="isGerritConnectDrawerOpen = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-gerrit-settings-drawer
    v-if="isGerritConnectDrawerOpen"
    v-model="isGerritConnectDrawerOpen"
    :integration="props.integration"
    :segment-id="props.segmentId"
    :grandparent-id="props.grandparentId"
  />
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfGerritSettingsDrawer from '@/config/integrations/gerrit/components/gerrit-settings-drawer.vue';

const props = defineProps<{
  integration: any,
  segmentId: string | null;
  grandparentId: string | null;
}>();

const isGerritConnectDrawerOpen = ref(false);
</script>

<script lang="ts">
export default {
  name: 'LfGerritDropdown',
};
</script>
