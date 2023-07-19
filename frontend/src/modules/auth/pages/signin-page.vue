<template>
  <div>
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      Signing you in
    </h3>
  </div>
</template>

<script>
import { Auth0Service } from '@/shared/services/auth0.service';

Auth0Service.loginWithRedirect();

export default {
  name: 'AppSigninPage',
  data() {
    return {
    };
  },
};
</script>

<style></style>
