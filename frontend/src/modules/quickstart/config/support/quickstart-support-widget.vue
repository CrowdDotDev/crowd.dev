<template>
  <div class="p-5 bg-gradient-to-b from-purple-50 via-white to-white ">
    <h6 class="text-center text-sm font-semibold pb-5">
      Need help with onboarding?
    </h6>
    <cr-menu-support-help />
  </div>
</template>

<script setup lang="ts">
import CrMenuSupportHelp from '@/modules/layout/components/menu/menu-support-help.vue';
</script>

<script lang="ts">
export default {
  name: 'CrQuickstartSupportWidget',
};
</script>
