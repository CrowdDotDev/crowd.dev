<template>
  <div
    class="grid grid-cols-3 md:grid-cols-2 gap-5 pr-8 pb-10 pl-3"
  >
    <div
      v-for="(_, index) in Array(3)"
      :key="index"
      class="col-span-1 flex flex-col gap-5"
    >
      <app-eagle-eye-loading-card
        :size="index === 1 ? 'medium' : 'small'"
      />
      <app-eagle-eye-loading-card />
    </div>
  </div>
</template>

<script setup>
import AppEagleEyeLoadingCard from '@/premium/eagle-eye/components/list/eagle-eye-loading-card.vue'
</script>
