<template>
  <lf-tooltip
    placement="top"
    content-class="!max-w-76 !p-3 !text-start"
    content="These integrations are temporarily disabled. Please contact the CM team for further questions."
  >
    <lf-button
      :disabled="true"
      type="secondary"
      @click="isConfluenceSettingsDrawerVisible = true"
    >
      <lf-icon name="link-simple" />
      <slot>Connect</slot>
    </lf-button>
  </lf-tooltip>

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
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import LfConfluenceSettingsDrawer from '@/config/integrations/confluence/components/confluence-settings-drawer.vue';

const props = defineProps<{
  integration: any;
  segmentId: string;
  grandparentId: string;
}>();

const isConfluenceSettingsDrawerVisible = ref(false);
</script>

<script lang="ts">
export default {
  name: 'LfConfluenceConnect',
};
</script>
