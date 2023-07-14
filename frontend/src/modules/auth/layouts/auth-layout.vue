<template>
  <div class="p-6 flex bg-white justify-center">
    <div class="logo absolute top-6 left-6">
      <img
        class="h-6 w-auto"
        src="/images/lf/logo_lfx_cm.svg"
        alt="lfx logo"
      />
    </div>
    <aside class="auth-side rounded-lg flex flex-col">
      <app-auth-layout-side />
    </aside>
    <main class="flex items-center justify-center">
      <div class="auth-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
import AppAuthLayoutSide from '@/modules/auth/components/layout/auth-layout-side.vue';

export default {
  name: 'AppAuthLayout',
  components: { AppAuthLayoutSide },
};
</script>

<style lang="scss" scoped>
.auth-side {
  background: linear-gradient(
    154.2deg,
    #ffffff 0%,
    #DBEBFE 57.5%
  );
  width: 28rem;
  position: fixed;
  top: 24px;
  left: 24px;
  min-height: calc(100vh - 48px);

  @media (max-width: 991px) {
    display: none;
  }
}

main {
  flex-shrink: 1;
  min-height: calc(100vh - 3rem);
  width: 100%;
  padding: 4.75rem 2rem 4.75rem 32.5rem;

  @media (max-width: 991px) {
    padding: 6rem 0;
  }

  .auth-content {
    max-width: 28rem;
    width: 100%;
  }
}

.logo {
  display: none;
  @media (max-width: 991px) {
    display: block;
  }
}
</style>
