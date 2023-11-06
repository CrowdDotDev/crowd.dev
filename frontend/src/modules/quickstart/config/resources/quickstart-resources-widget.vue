<template>
  <div class="pt-5 pb-2.5">
    <div class="px-5 pb-4">
      <h4 class="text-base font-semibold">
        Resources Hub
      </h4>
    </div>
    <div>
      <a
        v-for="link of resourcesLinks"
        :key="link.text"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="px-5 py-2.5 flex items-center transition hover:bg-gray-100"
      >
        <i class="text-base text-gray-400 mr-3" :class="link.icon" />
        <span class="text-xs text-black">{{ link.text }}</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { resourcesLinks } from '@/modules/quickstart/config/resources/links';
</script>

<script lang="ts">
export default {
  name: 'CrQuickstartResourcesWidget',
};
</script>
