<template>
  <div
    v-if="!isEmailDigestConfiguredOnce"
    class="bg-primary-25 rounded-lg p-5 shadow"
  >
    <div class="flex items-center gap-2">
      <lf-icon name="envelope-open" :size="20" class="text-gray-900" />
      <span class="text-gray-900 font-semibold text-sm">Email Digest</span>
    </div>

    <div class="text-2xs text-gray-600 mt-4 mb-6">
      Receive the 10 most relevant results from Community Lens
      automatically in your inbox.
    </div>

    <lf-button
      v-if="hasPermission(LfPermission.eagleEyeEdit)"
      type="primary"
      class="w-full !h-8"
      @click="isEmailDigestDrawerOpen = true"
    >
      Activate Email Digest
    </lf-button>
  </div>

  <div
    v-else
    class="bg-white rounded-lg shadow px-3 py-2 flex justify-between items-center"
  >
    <div class="flex items-center gap-3">
      <lf-icon name="envelope-open" :size="20" class="text-gray-900" />
      <div class="flex flex-col">
        <span class="text-gray-900 font-medium text-xs">Email Digest</span>
        <span
          class="text-2xs"
          :class="{
            'text-gray-500': !isEmailDigestActivated,
            'text-green-600': isEmailDigestActivated,
          }"
        >{{
          isEmailDigestActivated
            ? 'Active'
            : 'Deactivated'
        }}</span>
      </div>
    </div>

    <lf-button
      type="primary-link"
      class="!h-8 !w-8"
      @click="isEmailDigestDrawerOpen = true"
    >
      <lf-icon name="gear" :size="16" />
    </lf-button>
  </div>

  <app-eagle-eye-email-digest-drawer
    v-model="isEmailDigestDrawerOpen"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import AppEagleEyeEmailDigestDrawer from '@/modules/eagle-eye/components/list/eagle-eye-email-digest-drawer.vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

const { hasPermission } = usePermissions();

const eagleEyeSettings = computed(
  () => user.value?.tenants.find(
    (tu) => tu.tenantId === tenant.value.id,
  )?.settings.eagleEye,
);

const isEmailDigestDrawerOpen = ref(false);

const isEmailDigestConfiguredOnce = computed(
  () => !!Object.keys(eagleEyeSettings.value.emailDigest || {})
    .length,
);

const isEmailDigestActivated = computed(
  () => eagleEyeSettings.value?.emailDigestActive,
);
</script>
