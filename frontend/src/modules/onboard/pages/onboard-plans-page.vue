<template>
  <div class="overflow-auto mb-20">
    <div class="flex justify-center pt-16">
      <div>
        <h4 class="text-xl font-semibold leading-8 text-center">
          Choose your plan
        </h4>
        <p class="text-sm text-gray-600 leading-5 text-center">
          Pick plan which fits the needs for your company
        </p>
      </div>
    </div>

    <div class="container pb-2">
      <app-plans-list />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppPlansList from '@/modules/settings/components/plans-list.vue';
</script>

<style lang="scss" scoped>

.limit-width {
  @apply w-full px-8;
  max-width: 42.75rem;
}
</style>
