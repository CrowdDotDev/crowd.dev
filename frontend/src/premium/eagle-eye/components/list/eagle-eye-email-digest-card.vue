<template>
  <div
    v-if="!isEmailDigestConfiguredOnce"
    class="bg-purple-50 rounded-lg p-5 shadow"
  >
    <div class="flex items-center gap-2">
      <i class="ri-mail-open-line text-lg text-gray-900" />
      <span class="text-gray-900 font-semibold text-sm">Email Digest</span>
    </div>

    <div class="text-2xs text-gray-600 mt-4 mb-6">
      Receive the 10 most relevant results from Eagle Eye
      automatically in your inbox.
    </div>

    <el-button
      class="btn btn--primary btn--full !h-8"
      @click="isEmailDigestDrawerOpen = true"
    >
      Activate Email Digest
    </el-button>
  </div>

  <div
    v-else
    class="bg-white rounded-lg shadow px-3 py-2 flex justify-between items-center"
  >
    <div class="flex items-center gap-3">
      <i class="ri-mail-open-line text-lg text-gray-900" />
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

    <el-button
      class="btn btn--transparent !h-8 !w-8"
      @click="isEmailDigestDrawerOpen = true"
    >
      <i class="ri-sound-module-line text-base" />
    </el-button>
  </div>

  <app-eagle-eye-email-digest-drawer
    v-model="isEmailDigestDrawerOpen"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppEagleEyeEmailDigestDrawer from '@/premium/eagle-eye/components/list/eagle-eye-email-digest-drawer.vue';

const { currentUser, currentTenant } = mapGetters('auth');

const eagleEyeSettings = computed(
  () => currentUser.value?.tenants.find(
    (tu) => tu.tenantId === currentTenant.value.id,
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
