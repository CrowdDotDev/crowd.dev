<template>
  <app-eagle-eye-page />
</template>

<script setup>
import { onMounted, computed, defineAsyncComponent } from 'vue';
import AppPageLoader from '@/shared/loading/page-loader.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

const { updateSelectedProjectGroup } = useLfSegmentsStore();

const eagleEyeSettings = computed(
  () => user?.value?.tenants.find(
    (tu) => tu.tenantId === tenant?.value.id,
  )?.settings?.eagleEye,
);

const AppEagleEyePage = defineAsyncComponent({
  loader: () => {
    const isOnboarded = eagleEyeSettings.value?.onboarded;

    if (isOnboarded) {
      return import(
        '@/modules/eagle-eye/pages/eagle-eye-page.vue'
      );
    }

    return import(
      '@/modules/eagle-eye/pages/eagle-eye-onboard-page.vue'
    );
  },
  loadingComponent: AppPageLoader,
  delay: 0,
});

onMounted(() => {
  updateSelectedProjectGroup(null);
});
</script>
