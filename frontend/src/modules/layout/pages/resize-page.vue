<template>
  <div class="grid grid-cols-12 gap-4 mx-6 h-screen">
    <div class="col-span-8 col-start-3 h-fit self-center">
      <lf-icon name="expand" :size="128" class="text-gray-200 mb-8" />
      <h2 class="text-gray-900 mb-2">
        Resize window
      </h2>
      <div class="text-gray-600 text-base">
        The platform is not ready for lower resolutions,
        please resize your window in order to display the
        page contents.
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
</script>
