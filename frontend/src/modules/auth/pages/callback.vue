<template>
  <div>
    Logging you in
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { Auth0Service } from '@/shared/services/auth0.service';

onMounted(() => {
  Auth0Service.handleAuth()
    .then(() => {
      console.log(Auth0Service.authData());
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
