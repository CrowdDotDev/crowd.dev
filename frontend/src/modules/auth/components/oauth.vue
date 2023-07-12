<template>
  <a
    id="googleLogin"
    class="btn btn--secondary btn--lg w-full"
    @click="socialLogin('google-oauth2')"
  >
    <app-svg name="google" class="h-5 w-5" />
    <span class="pl-3 text-gray-600">Sign in with Google</span>
  </a>
</template>

<script setup lang="ts">

import AppSvg from '@/shared/svg/svg.vue';
import { Auth0Service } from '@/shared/services/auth0.service';

const socialLogin = (type: string) => {
  Auth0Service.authorize(type);
};
</script>

<script lang="ts">
export default {
  name: 'CrAuthOauth',
};
</script>
