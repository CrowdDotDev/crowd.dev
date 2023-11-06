<template>
  <app-page-wrapper>
    <div class="pb-6">
      <h4 class="mb-1">
        👋 Welcome aboard
      </h4>
      <p class="text-xs leading-5 text-gray-600">
        Get to know the crowd.dev product and start uncovering the most out of your community
      </p>
    </div>
    <div class="flex -mx-2.5">
      <div class="w-2/3 px-2.5">
        <cr-quickstart-guides />
      </div>
      <div class="w-1/3 px-2.5">
        <cr-quickstart-widgets />
      </div>
    </div>
  </app-page-wrapper>
</template>

<script setup lang="ts">

import CrQuickstartGuides from '@/modules/quickstart/components/quickstart-guides.vue';
import CrQuickstartWidgets from '@/modules/quickstart/components/quickstart-widgets.vue';
</script>

<script lang="ts">
export default {
  name: 'AppQuickstartPage',
};
</script>
