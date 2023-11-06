<template>
  <div class="p-5 bg-gradient-to-b from-purple-50 to-white to-50%">
    <h6 class="text-center text-sm font-semibold pb-5">
      Any questions or feedback?
    </h6>
    <div class="flex flex-col items-center pb-1">
      <div class="h-12 w-12 rounded-full overflow-hidden mb-2">
        <img alt="Jesse Singer" src="/images/quickstart/jesse.jpeg" class="object-cover" />
      </div>
      <p class="text-center text-sm font-medium mb-1">
        Jesse Singer
      </p>
      <p class="text-center text-2xs leading-5 text-gray-500">
        Customer Success
      </p>
    </div>
    <div>
      <a href="mailto:help@crowd.dev" target="_blank" rel="noopener noreferrer" class="block">
        <button type="button" class="btn btn--sm btn--bordered flex items-center w-full mt-3">
          <i class="ri-mail-line mr-2 text-base h-4 flex items-center" /> Get in touch
        </button>
      </a>
      <a href="#" target="_blank" class="block">
        <button type="button" class="btn btn--sm btn--bordered flex items-center w-full mt-3">
          <i class="ri-calendar-line mr-2 text-base h-4 flex items-center" /> Book a demo
        </button>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<script lang="ts">
export default {
  name: 'CrQuickstartSupportWidget',
};
</script>
