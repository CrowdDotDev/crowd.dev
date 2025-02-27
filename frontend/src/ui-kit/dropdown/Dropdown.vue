<template>
  <lf-popover :placement="props.placement" :persistent="props.persistent">
    <template #trigger>
      <slot name="trigger" />
    </template>
    <template #default="{ close }">
      <div
        v-click-outside="close"
        class="c-dropdown"
        :style="{ 'min-width': props.width, zIndex: props.zIndex }"
        @click="close"
      >
        <slot />
      </div>
    </template>
  </lf-popover>
</template>

<script setup lang="ts">
import { DropdownPlacement } from '@/ui-kit/dropdown/types/DropdownPlacement';
import LfPopover from '@/ui-kit/popover/Popover.vue';
import { ClickOutside as vClickOutside } from 'element-plus';

const props = withDefaults(defineProps<{
  placement: DropdownPlacement;
  width?: string;
  persistent?: boolean;
  zIndex?: number | string;
}>(), {
  placement: 'bottom-start',
  width: 'auto',
  persistent: false,
  zIndex: 'auto',
});
</script>

<script lang="ts">
export default {
  name: 'LfDropdown',
};
</script>
