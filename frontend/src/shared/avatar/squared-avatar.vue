<template>
  <el-avatar
    v-if="name"
    shape="square"
    class="h-8 w-8 bg-gray-900 rounded-md"
  >
    <template #default>
      <span class="font-semibold uppercase text-base">{{
        computedInitialLetter
      }}</span>
    </template>
  </el-avatar>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
});

const computedInitialLetter = computed(() => {
  const names = props.name
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ');

  return names[0].charAt(0).toUpperCase();
});
</script>
