<template>
  <div id="app">
    <div class="sm:hidden md:block lg:block">
      <lfx-header-v2 v-if="showLfxMenu" id="lfx-header" product="Community Management" />
      <div v-if="!isAuthenticated" class="flex items-center bg-white h-screen w-screen justify-center">
        <div
          v-loading="true"
          class="app-page-spinner h-20 w-20 !relative !min-h-20 custom"
        />
      </div>
      <router-view v-show="!loading" v-slot="{ Component }">
        <transition>
          <div>
            <component :is="Component" />
          </div>
        </transition>
      </router-view>

      <div id="teleport-modal" />
    </div>

    <div class="sm:block md:hidden lg:hidden">
      <app-resize-page />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex';
import AppResizePage from '@/modules/layout/pages/resize-page.vue';
import { FeatureFlag } from '@/featureFlag';
import config from '@/config';
import { AuthToken } from '@/modules/auth/auth-token';
import { Auth0Service } from '@/shared/services/auth0.service';

export default {
  name: 'App',

  components: {
    AppResizePage,
  },

  computed: {
    ...mapGetters({
      loadingInit: 'auth/loadingInit',
      currentTenant: 'auth/currentTenant',
      isAuthenticated: 'auth/isAuthenticated',
    }),
    ...mapState({
      featureFlag: (state) => state.tenant.featureFlag,
    }),
    loading() {
      return (
        (this.loadingInit && !!AuthToken.get())
        || (!this.featureFlag.isReady
          && !this.featureFlag.hasError
          && !config.isCommunityVersion)
      );
    },
    showLfxMenu() {
      return this.$route.name !== 'reportPublicView';
    },
  },

  async created() {
    await Auth0Service.init();
    await this.doInit();

    FeatureFlag.init(this.currentTenant);

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  },

  mounted() {
    this.$router.isReady().then(() => {
      const { ref } = this.$route.query;
      if (ref && ref === 'eagle-eye') {
        localStorage.setItem('onboardType', 'eagle-eye');
      }
    });
  },

  unmounted() {
    window.removeEventListener('resize', this.handleResize);
  },

  methods: {
    ...mapActions({
      doInit: 'auth/doInit',
      resize: 'layout/resize',
    }),

    handleResize() {
      this.resize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    },
  },
};
</script>

<style lang="scss">
@import 'assets/scss/index.scss';

.app-page-spinner.custom .el-loading-spinner .circular {
  height: 12rem;
  width: 12rem;
}
</style>
