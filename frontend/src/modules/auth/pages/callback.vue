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
import { useRoute, useRouter } from 'vue-router';

const { doSigninWithAuth0 } = mapActions('auth');

const route = useRoute();

onMounted(() => {
  const { code } = route.query;
  if (code) {
    Auth0Service.handleAuth(code as string)
      .then(() => {
        const { idToken, accessToken } = Auth0Service.authData();

        return doSigninWithAuth0(idToken);
      });
  }
});
</script>

<script lang="ts">
export default {
  name: 'AppAuthCallback',
};
</script>
