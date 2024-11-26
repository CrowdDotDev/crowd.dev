<template>
  <div class="pill" :class="props.color + ' ' + props.type">
    <slot />
  </div>
</template>


<script lang="ts" setup>
const props = withDefaults(defineProps<{
  type: 'solid' | 'bordered';
  color: string;
}>(), {
  type: 'solid',
});
</script>

<script lang="ts">
export default {
  name: 'Pill',
};
</script>

<style lang="scss">
.pill {
  @apply text-xs font-semibold rounded-full px-2.5 py-0.5 min-w-[60px] text-center;
  &.bordered {
    @apply border border-gray-200 border-solid font-normal;
  }
}
</style>
