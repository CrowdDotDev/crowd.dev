<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden w-full">
    <div class="pt-4 px-4 pb-6 bg-gradient-to-b from-brand-25 to-white flex items-center">
      <div class="h-5 w-5 flex items-center justify-center mr-1">
        <cr-spinner size="1rem" class="!border-brand-800" />
      </div>
      <h6 class="text-base leading-5 font-semibold">
        Connecting integrations...
      </h6>
    </div>
    <section class="px-4">
      <div class="pb-4">
        <p class="text-2xs leading-4.5 text-gray-400 mb-0.5">
          Sub-project
        </p>
        <p class="text-xs font-semibold leading-4.5">
          Kubernetes
        </p>
      </div>
      <article class="pb-4 flex">
        <div class="w-4 !min-w-4 mr-2 basis-4">
          <img alt="Github" :src="CrowdIntegrations.getConfig('github')?.image" class="w-4 h-4 min-w-4">
        </div>
        <div class="-mt-px">
          <app-integration-progress-bar />
        </div>
      </article>
      <article class="pb-4 flex">
        <div class="w-4 !min-w-4 mr-2 basis-4">
          <img alt="Github" :src="CrowdIntegrations.getConfig('github')?.image" class="w-4 h-4 min-w-4">
        </div>
        <div class="-mt-px">
          <app-integration-progress-bar />
        </div>
      </article>
    </section>
    <section class="px-4 pt-4 border-t border-gray-200">
      <div class="pb-4">
        <p class="text-2xs leading-4.5 text-gray-400 mb-0.5">
          Sub-project
        </p>
        <p class="text-xs font-semibold leading-4.5">
          Kubernetes
        </p>
      </div>
      <article class="pb-4 flex">
        <div class="w-4 !min-w-4 mr-2 basis-4">
          <img alt="Github" :src="CrowdIntegrations.getConfig('github')?.image" class="w-4 h-4 min-w-4">
        </div>
        <div class="-mt-px">
          <app-integration-progress-bar />
        </div>
      </article>
      <article class="pb-4 flex">
        <div class="w-4 !min-w-4 mr-2 basis-4">
          <img alt="Github" :src="CrowdIntegrations.getConfig('github')?.image" class="w-4 h-4 min-w-4">
        </div>
        <div class="-mt-px">
          <app-integration-progress-bar />
        </div>
      </article>
    </section>
  </div>
</template>

<script lang="ts" setup>

import CrSpinner from '@/ui-kit/spinner/Spinner.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppIntegrationProgressBar from '@/modules/integration/components/integration-progress-bar.vue';
</script>

<script lang="ts">
export default {
  name: 'CrDashboardIntegrations',
};
</script>
