<template>
  <div class="flex flex-col items-center">
    <app-eagle-eye-loading-card
      size="small"
      class="mt-30 w-64"
    />
    <h5 class="mt-8">Loading results...</h5>
    <div
      v-if="showLongerLoading"
      class="text-gray-600 text-sm mt-4"
    >
      Generating your Eagle Eye feed can take up to 10
      seconds.
    </div>
  </div>
</template>

<script setup>
import AppEagleEyeLoadingCard from '@/premium/eagle-eye/components/list/eagle-eye-loading-card.vue'
import { onMounted, onUnmounted, ref } from 'vue'

const showLongerLoading = ref(false)
const timeout = ref()

onMounted(() => {
  timeout.value = setTimeout(() => {
    showLongerLoading.value = true
  }, 2000)
})

onUnmounted(() => {
  clearTimeout(timeout.value)
})
</script>
