<template>
  <div class="flex flex-col items-center gap-16">
    <div class="flex gap-4 items-center">
      <img src="/images/lf/logo_lfx_cm.svg" alt="lf logo" class="h-5" />
      <el-divider direction="vertical" class="h-5 !m-0" />
      <div class="text-xl text-brand-500">
        Community Management
      </div>
    </div>
    <div class="flex gap-4 items-center">
      <div
        v-loading="true"
        class="app-page-spinner h-10 w-10 !relative !min-h-10"
      />
      <div class="font-semibold text-lg">
        Signing you in...
      </div>
    </div>
  </div>
</template>

<script>
import { Auth0Service } from '@/shared/services/auth0.service';

export default {
  name: 'AppSigninPage',
  created() {
    Auth0Service.loginWithRedirect();
  },
};
</script>

<style></style>
