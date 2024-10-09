<template>
  <div class="py-10 h-screen w-full flex flex-col items-center justify-center">
    <section class="flex justify-center items-center pb-10">
      <div class="w-20 h-20 bg-white shadow-md rounded-full flex items-center justify-center mr-4">
        <lf-icon name="git-repository-line" :size="40" />
      </div>
      <div class="flex items-center gap-2">
        <div class="w-1 h-1 rounded-full bg-gray-300" />
        <div class="w-1 h-1 rounded-full bg-gray-300" />
        <div class="w-1 h-1 rounded-full bg-gray-300" />
        <div class="w-1 h-1 rounded-full bg-gray-300" />
      </div>
      <div class="px-2">
        <lf-icon name="checkbox-circle-fill" :size="20" class="text-green-500" />
      </div>
      <div class="flex items-center gap-2">
        <div class="w-1 h-1 rounded-full bg-gray-300" />
        <div class="w-1 h-1 rounded-full bg-gray-300" />
        <div class="w-1 h-1 rounded-full bg-gray-300" />
        <div class="w-1 h-1 rounded-full bg-gray-300" />
      </div>
      <div class="w-20 h-20 bg-white shadow-md rounded-full flex items-center justify-center ml-4">
        <div>
          <img alt="LFX logo" src="/images/logo/lfx.svg" />
        </div>
      </div>
    </section>
    <section>
      <h4 class="text-center pb-6">
        LFX CM successfully installed
      </h4>
      <p class="text-medium">
        You have successfully connected LFX CM app with your GitHub repository.
      </p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import LfIcon from '@/ui-kit/icon/Icon.vue';
</script>

<script lang="ts">
export default {
  name: 'LfIntegrationSuccessPage',
};
</script>
