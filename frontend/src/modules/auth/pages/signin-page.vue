<template>
  <div class="flex items-center bg-white h-full w-full justify-center">
    <div
      v-loading="true"
      class="app-page-spinner h-20 w-20 !relative !min-h-20 custom"
    />
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

<style lang="scss">
.app-page-spinner.custom .el-loading-spinner .circular {
  height: 12rem;
  width: 12rem;
}
</style>
