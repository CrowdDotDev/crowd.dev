<template>
  <div class="c-table" :class="`c-table--${props.type}`">
    <table>
      <slot />
    </table>
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  type: 'regular' | 'bordered'
}>(), {
  type: 'regular',
});
</script>

<script lang="ts">
export default {
  name: 'CrTable',
};
</script>
