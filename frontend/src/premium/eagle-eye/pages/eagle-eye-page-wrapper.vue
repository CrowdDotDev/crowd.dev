<template>
  <eagle-eye-page />
</template>

<script setup>
import { inject } from 'vue'
import { defineAsyncComponent } from 'vue'
import AppPageLoader from '@/shared/loading/page-loader.vue'

const unleash = inject('unleash')

const EagleEyePage = defineAsyncComponent({
  loader: async () => {
    const isFeatureEnabled = await unleash.isFlagEnabled(
      unleash.flags.eagleEye
    )

    if (isFeatureEnabled) {
      return import(
        '@/premium/eagle-eye/pages/eagle-eye-page.vue'
      )
    }

    return import('@/modules/layout/pages/paywall-page.vue')
  },
  loadingComponent: AppPageLoader
})
</script>
