<template>
  <div class="px-5 pb-5 pt-6">
    <div class="flex justify-center pb-4">
      <div class="bg-brand-500 flex items-center rounded-2xl py-1 px-2">
        <i class="ri-vip-crown-2-fill text-white text-base h-4 flex items-center" />
        <span class="text-xs text-white font-medium leading-4 pl-2">Scale plan</span>
      </div>
    </div>
    <h6 class="text-center text-sm font-semibold pb-4">
      Unlock the full power of crowd.dev
    </h6>
    <div>
      <article class="flex pb-2">
        <i class="ri-checkbox-circle-fill text-base text-black h-4.5 flex items-center" />
        <span class="pl-2 text-xs leading-2">Funnel sales prospects to your CRM.</span>
      </article>
      <article class="flex pb-2">
        <i class="ri-checkbox-circle-fill text-base text-black h-4.5 flex items-center" />
        <span class="pl-2 text-xs leading-2">Automatically enrich contacts and organizations.</span>
      </article>
      <article class="flex pb-2">
        <i class="ri-checkbox-circle-fill text-base text-black h-4.5 flex items-center" />
        <span class="pl-2 text-xs leading-2">Connect HubSpot and LinkedIn for a stronger pipeline.</span>
      </article>
    </div>
    <div class="text-xs text-center text-gray-500 italic pt-1 pb-4">
      ...and more
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
