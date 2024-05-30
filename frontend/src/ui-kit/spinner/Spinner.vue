<template>
  <div class="c-spinner" :style="{ '--lf-spinner-size': props.size }" />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: string,
}>(), {
  size: '2rem',
});

</script>

<script lang="ts">
export default {
  name: 'LfSpinner',
};
</script>
