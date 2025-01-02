<template>
  <lf-dropdown-item @click="isConfluenceSettingsDrawerVisible = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-confluence-settings-drawer
    v-if="isConfluenceSettingsDrawerVisible"
    v-model="isConfluenceSettingsDrawerVisible"
    :integration="props.integration"
    :segment-id="props.segmentId"
    :grandparent-id="props.grandparentId"
  />
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfConfluenceSettingsDrawer from '@/config/integrations/confluence/components/confluence-settings-drawer.vue';

const props = defineProps<{
  integration: any,
  segmentId: string,
  grandparentId: string,
}>();

const isConfluenceSettingsDrawerVisible = ref(false);
// const isDetailsModalOpen = ref(false);
</script>

<script lang="ts">
export default {
  name: 'AppGitConnect',
};
</script>
