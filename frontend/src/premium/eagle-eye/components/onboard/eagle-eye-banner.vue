<template>
  <div
    class="bg-brand-50/50 relative p-8 h-fit"
    :class="{ 'h-68': showImage }"
  >
    <div class="">
      <div
        class="uppercase text-xs text-brand-500 font-semibold"
      >
        {{ preTitle }}
      </div>
      <h4 class="text-gray-900 mt-2">
        {{ title }}
      </h4>
    </div>

    <img
      v-if="showImage"
      alt="Community Lens banner"
      class="absolute bottom-0 right-0 w-3/5"
      src="/images/eagle-eye/banner.png"
    />
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  preTitle: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  showImage: {
    type: Boolean,
    default: false,
  },
});
</script>
