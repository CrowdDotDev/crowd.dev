<template>
  <div>
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      👋 Welcome back
    </h3>
    <div class="pt-10">
      <a
        id="googleLogin"
        class="btn btn--secondary btn--lg w-full"
        @click="signin()"
      >
        <span class="pl-3 text-gray-600">Sign in</span>
      </a>
    </div>
  </div>
</template>

<script>
import { Auth0Service } from '@/shared/services/auth0.service';

export default {
  name: 'AppSigninPage',
  data() {
    return {
    };
  },

  methods: {
    signin() {
      Auth0Service.loginWithRedirect();
    },
  },
};
</script>

<style></style>
