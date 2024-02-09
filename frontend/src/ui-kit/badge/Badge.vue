<template>
  <div
    class="c-badge"
    :class="[
      `c-badge--${props.size}`,
      `c-badge--${props.type}`,
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { BadgeSize } from '@/ui-kit/badge/types/BadgeSize';
import { BadgeType } from '@/ui-kit/badge/types/BadgeType';

const props = withDefaults(defineProps<{
  size?: BadgeSize,
  type?: BadgeType,
}>(), {
  size: 'medium',
  type: 'default',
});
</script>

<script lang="ts">
export default {
  name: 'CrBadge',
};
</script>
