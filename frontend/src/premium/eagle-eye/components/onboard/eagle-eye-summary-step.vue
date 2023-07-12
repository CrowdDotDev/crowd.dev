<template>
  <div class="flex flex-col gap-6">
    <div class="flex gap-8 items-center">
      <div
        class="basis-2/5 bg-gray-50 rounded-lg flex items-center justify-center h-34"
      >
        <img alt="Community Lens onboarding discover" src="/images/eagle-eye/onboard-discover.png" />
      </div>

      <div class="basis-3/5">
        <h6 class="text-gray-900">
          Discover
        </h6>
        <div class="text-xs text-gray-500 mt-2">
          Locate the most relevant content in your niche
          across multiple community platforms.
        </div>
      </div>
    </div>

    <div class="flex gap-8 items-center">
      <div
        class="basis-2/5 bg-gray-50 rounded-lg flex items-center justify-center h-34"
      >
        <img alt="Engage" src="/images/eagle-eye/onboard-engage.png" />
      </div>

      <div class="basis-3/5">
        <h6 class="text-gray-900">
          Engage
        </h6>
        <div class="text-xs text-gray-500 mt-2">
          Engage in the comment section and add genuine
          value to the conversation.
        </div>
      </div>
    </div>

    <div class="flex gap-8 items-center">
      <div
        class="basis-2/5 bg-gray-50 rounded-lg flex items-center justify-center h-34"
      >
        <img alt="Community Lens onboarding" src="/images/eagle-eye/onboard-grow.png" />
      </div>

      <div class="basis-3/5">
        <h6 class="text-gray-900">
          Grow
        </h6>
        <div class="text-xs text-gray-500 mt-2">
          Gain developers' mindshare, increase brand
          awareness, and growth your community (and
          business) organically.
        </div>
      </div>
    </div>
  </div>

  <eagle-eye-footer
    :show-previous-step="true"
    :show-final-step="true"
    @on-step-change="
      (increment) => emit('onStepChange', increment)
    "
    @on-submit="emit('onSubmit')"
  />
</template>

<script setup>
import { defineEmits } from 'vue';
import EagleEyeFooter from '@/premium/eagle-eye/components/onboard/eagle-eye-footer.vue';

const emit = defineEmits(['onStepChange', 'onSubmit']);
</script>
