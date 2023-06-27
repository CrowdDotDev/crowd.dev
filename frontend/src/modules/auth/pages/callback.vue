<template>
  <div class="flex items-center h-screen">
    <div
      v-loading="true"
      class="app-page-spinner h-14"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { Auth0Service } from '@/shared/services/auth0.service';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { useRouter } from 'vue-router';

const { doSigninWithAuth0 } = mapActions('auth');

const router = useRouter();

onMounted(() => {
  console.log('handling')
  Auth0Service.handleAuth()
    .then(() => {
      const { idToken, profile } = Auth0Service.authData();
      if (!profile.email_verified) {
        router.push({ name: 'emailUnverified' });
        return Promise.resolve();
      }
      return doSigninWithAuth0(idToken);
    })
});
</script>

<script lang="ts">
export default {
  name: 'AppAuthCallback',
};
</script>
