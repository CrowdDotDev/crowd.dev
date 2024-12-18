<template>
  <lf-popover :placement="props.placement">
    <template #trigger>
      <slot name="trigger" />
    </template>
    <template #default="{ close }">
      <div
        class="c-dropdown"
        :style="{ 'min-width': props.width }"
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

const props = withDefaults(defineProps<{
  placement: DropdownPlacement;
  width?: string;
}>(), {
  placement: 'bottom-start',
  width: 'auto',
});
</script>

<script lang="ts">
export default {
  name: 'LfDropdown',
};
</script>
