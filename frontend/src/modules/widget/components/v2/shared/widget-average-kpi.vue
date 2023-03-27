<template>
  <div class="text-gray-900 font-medium text-2xl">
    {{ result }}
  </div>
  <div class="text-gray-500 text-xs">
    {{ description }}
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  result: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});
</script>
