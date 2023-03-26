<template>
  <div class="flex gap-6 items-center justify-center">
    <i class="text-3xl text-gray-300" :class="icon" />
    <div class="text-gray-400 italic text-xs">
      {{ description }}
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  icon: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});
</script>
