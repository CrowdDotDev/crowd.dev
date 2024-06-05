<template>
  <div
    class="c-tooltip"
    :class="[`c-tooltip--${placement}`, props.disabled ? 'c-tooltip--disabled' : '']"
  >
    <div class="c-tooltip__content">
      <slot name="content">
        {{ props.content }}
      </slot>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { TooltipPlacement } from '@/ui-kit/tooltip/types/TooltipPlacement';

const props = withDefaults(defineProps<{
  placement?: TooltipPlacement,
  content?: string,
  disabled?: boolean,
}>(), {
  placement: 'top',
  content: '',
  disabled: false,
});
</script>

<script lang="ts">
export default {
  name: 'LfTooltip',
};
</script>
