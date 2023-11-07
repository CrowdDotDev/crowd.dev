<template>
  <div class="px-5 pb-5 pt-6">
    <div class="flex justify-center pb-4 items-center">
      <i class="ri-arrow-up-circle-line text-brand-500 text-2xl h-8 flex items-center" />
    </div>
    <h6 class="text-center text-sm font-semibold pb-5">
      Unlock the full power of crowd.dev
    </h6>
    <div class="flex flex-col items-center pb-3">
      <div class="text-xs leading-5 py-px px-2 rounded-full border mb-2 bg-gray-50 border-gray-300">
        10K monthly active contacts
      </div>
      <div class="text-xs leading-5 py-px px-2 rounded-full border mb-2 bg-purple-100 border-purple-300">
        Smart enrichment
      </div>
      <div class="text-xs leading-5 py-px px-2 rounded-full border mb-2 bg-orange-100 border-orange-300">
        2-way sync with HubSpot
      </div>
      <div class="text-xs leading-5 py-px px-2 rounded-full border mb-2 border-gray-300">
        ...and more
      </div>
    </div>
    <router-link :to="{ name: 'settings', query: { activeTab: 'plans' } }" class="block">
      <button type="button" class="btn btn--primary btn--sm w-full">
        Upgrade plan
      </button>
    </router-link>
  </div>
</template>

<script setup lang="ts">
</script>

<script lang="ts">
export default {
  name: 'CrQuickstartUpgradePlanWidget',
};
</script>
