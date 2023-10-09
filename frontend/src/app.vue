<template>
  <div v-show="!loading" id="app">
    <div class="sm:hidden md:block lg:block">
      <router-view v-slot="{ Component }">
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
import { FeatureFlag } from '@/utils/featureFlag';
import config from '@/config';
import { AuthToken } from '@/modules/auth/auth-token';

export default {
  name: 'App',

  components: {
    AppResizePage,
  },

  computed: {
    ...mapGetters({
      loadingInit: 'auth/loadingInit',
      currentTenant: 'auth/currentTenant',
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
  },

  async created() {
    await this.doInit();

    FeatureFlag.init(this.currentTenant);

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
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
</style>
