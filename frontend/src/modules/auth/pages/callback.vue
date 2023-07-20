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

const { doSigninWithAuth0 } = mapActions('auth');

onMounted(() => {
  Auth0Service.handleAuth()
    .then(() => {
      const { idToken } = Auth0Service.authData();

      return doSigninWithAuth0(idToken);
    })
    .catch(() => {
      Auth0Service.logout();
    });
});
</script>

<script lang="ts">
export default {
  name: 'AppAuthCallback',
};
</script>
