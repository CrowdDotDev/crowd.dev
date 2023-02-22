<template>
  <app-eagle-eye-page />
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import AppPageLoader from '@/shared/loading/page-loader.vue'
import { FeatureFlag } from '@/featureFlag'
import { mapGetters } from '@/shared/vuex/vuex.helpers'

const { currentUser } = mapGetters('auth')

const AppEagleEyePage = defineAsyncComponent({
  loader: () => {
    const isFeatureEnabled = FeatureFlag.isFlagEnabled(
      FeatureFlag.flags.eagleEye
    )

    if (isFeatureEnabled) {
      const isOnboarded =
        currentUser.value.eagleEyeSettings?.onboarded

      if (isOnboarded) {
        return import(
          '@/premium/eagle-eye/pages/eagle-eye-page.vue'
        )
      } else {
        return import(
          '@/premium/eagle-eye/pages/eagle-eye-onboard-page.vue'
        )
      }
    }

    return import('@/modules/layout/pages/paywall-page.vue')
  },
  loadingComponent: AppPageLoader,
  delay: 0
})
</script>
