<template>
  <main class="flex items-center justify-center">
    <router-view />
  </main>
</template>

<script>
import { mapGetters } from 'vuex';
import { Auth0Service } from '@/shared/services/auth0.service';

export default {
  name: 'AppAuthLayout',
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
    }),
  },
  watch: {
    isAuthenticated: {
      immediate: true,
      async handler(value) {
        if (value) {
          try {
            const user = await Auth0Service.getUser();
            const lfxHeader = document.getElementById('lfx-header');

            if (lfxHeader) {
              lfxHeader.authuser = user;
            }
          } catch (e) {
            console.error(e);
          }
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped>

main {
  flex-shrink: 1;
  height: 100vh;
  width: 100%;
}
</style>
