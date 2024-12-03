<template>
  <el-container v-if="tenant" class="flex-col">
    <el-container style="height: calc(100vh - 60px); margin-top: 60px;">
      <!-- App menu -->
      <lf-menu />

      <el-container class="bg-white">
        <el-main id="main-page-wrapper" class="relative flex flex-col">
          <app-lf-banners />
          <router-view />
          <div v-if="footerStore.visible" class="mt-auto mb-1 flex justify-center">
            <lfx-footer class="px-2 max-w-3xl" />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import AppLfBanners from '@/modules/lf/layout/components/lf-banners.vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import LfMenu from '@/modules/layout/components/menu/menu.vue';
import '@linuxfoundation/lfx-ui-core';
import { useFooterStore } from '../footer-store';

const authStore = useAuthStore();
const footerStore = useFooterStore();
const { tenant } = storeToRefs(authStore);
</script>

<script lang="ts">
export default {
  name: 'AppLayout',
};
</script>
