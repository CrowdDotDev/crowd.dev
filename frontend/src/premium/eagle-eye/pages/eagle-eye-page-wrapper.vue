<template>
  <app-eagle-eye-page />
</template>

<script setup>
import { onMounted, computed, defineAsyncComponent } from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppPageLoader from '@/shared/loading/page-loader.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const { currentUser, currentTenant } = mapGetters('auth');

const { updateSelectedProjectGroup } = useLfSegmentsStore();

const eagleEyeSettings = computed(
  () => currentUser?.value?.tenants.find(
    (tu) => tu.tenantId === currentTenant?.value.id,
  )?.settings?.eagleEye,
);

const AppEagleEyePage = defineAsyncComponent({
  loader: () => {
    const isOnboarded = eagleEyeSettings.value?.onboarded;

    if (isOnboarded) {
      return import(
        '@/premium/eagle-eye/pages/eagle-eye-page.vue'
      );
    }

    return import(
      '@/premium/eagle-eye/pages/eagle-eye-onboard-page.vue'
    );
  },
  loadingComponent: AppPageLoader,
  delay: 0,
});

onMounted(() => {
  updateSelectedProjectGroup(null);
});
</script>
