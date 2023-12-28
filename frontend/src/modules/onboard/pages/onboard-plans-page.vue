<template>
  <div class="overflow-auto mb-20">
    <div class="w-72 pt-3 pl-3 absolute top-0 lef-0">
      <div class="bg-white shadow rounded-md">
        <cr-menu-workspace v-if="currentUser.tenants.length > 1" :plain="true" />
      </div>
    </div>
    <div class="flex justify-center pt-16">
      <div>
        <h4 class="text-xl font-semibold leading-8 text-center">
          Choose your plan
        </h4>
        <p class="text-sm text-gray-600 leading-5 text-center">
          Pricing plans suited for your company stage.
        </p>
      </div>
    </div>

    <div class="container pb-2 mt-6">
      <app-plans-list />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppPlansList from '@/modules/settings/components/plans-list.vue';
import CrMenuWorkspace from '@/modules/layout/components/menu/menu-workspace.vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const { currentUser } = mapGetters('auth');

</script>

<style lang="scss" scoped>

.limit-width {
  @apply w-full px-8;
  max-width: 42.75rem;
}
</style>
