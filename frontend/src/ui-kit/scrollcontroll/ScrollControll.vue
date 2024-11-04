<template>
  <div class="relative overflow-auto" v-bind="$attrs" @scroll="controlScroll">
    <slot />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{(e: 'bottom'): void}>();

const controlScroll = (e: any) => {
  if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 10) {
    emit('bottom');
  }
};
</script>

<script lang="ts">
export default {
  name: 'LfScrollControll',
};
</script>
