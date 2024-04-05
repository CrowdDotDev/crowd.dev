<template>
  <div
    class="c-dropdown__item"
    :class="[
      props.type && `c-dropdown__item--${type}`,
      { 'is-disabled': props.disabled },
    ]"
    @click="handleClick"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { DropdownItemType } from '@/ui-kit/dropdown/types/DropdownItemType';

const props = withDefaults(defineProps<{
  disabled?: boolean
  type?: DropdownItemType,
}>(), {
  disabled: false,
  type: 'regular',
});

const handleClick = (event: MouseEvent) => {
  if (props.disabled) {
    event.preventDefault();
    event.stopPropagation();
  }
};
</script>

<script lang="ts">
export default {
  name: 'CrDropdownItem',
};
</script>
