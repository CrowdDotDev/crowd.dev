<template>
  <lf-tooltip
    placement="top"
    content-class="!max-w-76 !p-3 !text-start"
    content="These integrations are temporarily disabled. Please contact the CM team for further questions."
  >
    <lf-button
      :disabled="true"
      type="secondary"
      @click="isJiraSettingsDrawerVisible = true"
    >
      <lf-icon name="link-simple" />
      <slot>Connect</slot>
    </lf-button>
  </lf-tooltip>
  <lf-jira-settings-drawer
    v-if="isJiraSettingsDrawerVisible"
    v-model="isJiraSettingsDrawerVisible"
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
import LfJiraSettingsDrawer from '@/config/integrations/jira/components/jira-settings-drawer.vue';

const props = defineProps<{
  integration: any;
  segmentId: string | null;
  grandparentId: string | null;
}>();

const isJiraSettingsDrawerVisible = ref(false);
</script>

<script lang="ts">
export default {
  name: 'LfJiraConnect',
};
</script>
