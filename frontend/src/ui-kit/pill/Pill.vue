<template>
  <span class="lf-pill"
    :class="[
      `lf-pill--${props.color}`,
      `lf-pill--${props.type}`,
      props.class,
    ]"
  >
    <slot />
  </span>
</template>

<script lang="ts" setup>
import { PillColor } from '@/ui-kit/pill/types/PillColor';
import { PillType } from './types/PillType';

const props = withDefaults(defineProps<{
  type: PillType;
  color: PillColor;
  class?: string;
}>(), {
  type: 'solid',
});
</script>

<script lang="ts">
export default {
  name: 'LfPill',
};
</script>

<style lang="scss" src="./pill.scss"></style>
