<template>
  <eagle-eye-page />
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import AppPageLoader from '@/shared/loading/page-loader.vue'
import { FeatureFlag } from '@/unleash'

const EagleEyePage = defineAsyncComponent({
  loader: () => {
    const isFeatureEnabled = FeatureFlag.isFlagEnabled(
      FeatureFlag.flags.eagleEye
    )

    if (isFeatureEnabled) {
      return import(
        '@/premium/eagle-eye/pages/eagle-eye-page.vue'
      )
    }

    return import('@/modules/layout/pages/paywall-page.vue')
  },
  loadingComponent: AppPageLoader,
  delay: 0
})
</script>
