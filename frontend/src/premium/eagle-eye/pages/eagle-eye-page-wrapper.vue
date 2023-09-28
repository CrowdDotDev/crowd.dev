<template>
  <app-eagle-eye-page />
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue';
import AppPageLoader from '@/shared/loading/page-loader.vue';
import { FeatureFlag } from '@/utils/featureFlag';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const { currentUser, currentTenant } = mapGetters('auth');

const eagleEyeSettings = computed(
  () => currentUser?.value?.tenants.find(
    (tu) => tu.tenantId === currentTenant?.value.id,
  )?.settings?.eagleEye,
);

const AppEagleEyePage = defineAsyncComponent({
  loader: () => {
    const isFeatureEnabled = FeatureFlag.isFlagEnabled(
      FeatureFlag.flags.eagleEye,
    );

    if (isFeatureEnabled) {
      const isOnboarded = eagleEyeSettings.value?.onboarded;

      if (isOnboarded) {
        return import(
          '@/premium/eagle-eye/pages/eagle-eye-page.vue'
        );
      }
      return import(
        '@/premium/eagle-eye/pages/eagle-eye-onboard-page.vue'
      );
    }

    return import('@/modules/layout/pages/paywall-page.vue');
  },
  loadingComponent: AppPageLoader,
  delay: 0,
});
</script>
