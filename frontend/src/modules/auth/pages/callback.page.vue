<template>
  <div class="flex items-center justify-center h-screen">
    <cr-spinner size="5rem" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Auth0Service } from '@/modules/auth/services/auth0.service';
import CrSpinner from '@/ui-kit/spinner/Spinner.vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { router } from '@/router';

const { authCallback } = useAuthStore();

const auth0State = ref<any>(null);

onMounted(() => {
  Auth0Service.handleAuth()
    .then(({ appState }) => {
      auth0State.value = appState;
      return Auth0Service.authData();
    })
    .then((token) => authCallback(token))
    .then(() => {
      router.push(auth0State.value?.targetUrl ?? '/');
    });
});
</script>

<script lang="ts">
export default {
  name: 'AuthCallback',
};
</script>
