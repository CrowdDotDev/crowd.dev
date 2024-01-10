<template>
  <div id="app">
    <div class="sm:hidden md:block lg:block">
      <lfx-header-v2 v-if="showLfxMenu" id="lfx-header" product="Community Management" />
      <div v-if="loading" class="flex items-center bg-white h-screen w-screen justify-center">
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
import { FeatureFlag } from '@/utils/featureFlag';
import config from '@/config';
import { AuthToken } from '@/modules/auth/auth-token';
import { Auth0Service } from '@/shared/services/auth0.service';
import identify from '@/shared/monitoring/identify';
import initializePendo from '@/shared/monitoring/initializePendo';
import { mapActions as piniaMapActions } from 'pinia';
import { useActivityStore } from '@/modules/activity/store/pinia';
import { useActivityTypeStore } from '@/modules/activity/store/type';

export default {
  name: 'App',

  components: {
    AppResizePage,
  },

  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      isAuthenticated: 'auth/isAuthenticated',
      currentUser: 'auth/currentUser',
    }),
    ...mapState({
      featureFlag: (state) => state.tenant.featureFlag,
    }),
    loading() {
      return (
        !((this.isAuthenticated && !!AuthToken.get())
        || (!this.featureFlag.isReady
          && !this.featureFlag.hasError
          && !config.isCommunityVersion))
      );
    },
    showLfxMenu() {
      return this.$route.name !== 'reportPublicView';
    },
  },

  watch: {
    isAuthenticated: {
      async handler(value) {
        if (value) {
          this.fetchActivityTypes();
          this.fetchActivityChannels();

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
    currentUser: {
      handler(user, oldUser) {
        if (user?.id && user.id !== oldUser?.id) {
          identify(user);
          initializePendo(user, this.currentTenant);
        }
      },
    },
  },

  async created() {
    FeatureFlag.init(this.currentTenant);

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  },

  unmounted() {
    window.removeEventListener('resize', this.handleResize);
  },

  methods: {
    ...mapActions({
      resize: 'layout/resize',
    }),
    ...piniaMapActions(useActivityStore, {
      fetchActivityChannels: 'fetchActivityChannels',
    }),
    ...piniaMapActions(useActivityTypeStore, {
      fetchActivityTypes: 'fetchActivityTypes',
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
