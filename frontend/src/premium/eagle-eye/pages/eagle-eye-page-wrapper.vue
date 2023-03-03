<template>
  <app-eagle-eye-page />
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import AppPageLoader from '@/shared/loading/page-loader.vue'
import { FeatureFlag } from '@/featureFlag'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
console.log("ASD")

const { currentUser, currentTenant } = mapGetters('auth')

console.log("Current user: ")
console.log(currentUser)
console.log("Current tenant: ")
console.log(currentTenant)

console.log("current user.value.tenants: ")
console.log(currentUser.value.tenants)

console.log("currentTenant.value.id: ")
console.log(currentTenant.value.id)

const x = currentUser?.value.tenants.find(
  (tu) => tu.tenantId === currentTenant?.value.id
)

console.log("Found tenantUser: ")
console.log(x)


const eagleEyeSettings = currentUser?.value.tenants.find(
  (tu) => tu.tenantId === currentTenant?.value.id
).settings?.eagleEye

console.log("Eagle eye settings: ")
console.log(eagleEyeSettings)

const AppEagleEyePage = defineAsyncComponent({
  loader: () => {
    const isFeatureEnabled = FeatureFlag.isFlagEnabled(
      FeatureFlag.flags.eagleEye
    )

    if (isFeatureEnabled) {
      const isOnboarded = eagleEyeSettings?.onboarded

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
