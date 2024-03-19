<template>
  <div id="app">
    <div class="sm:hidden md:block lg:block xl:block">
      <lfx-header-v2 v-if="showLfxMenu" id="lfx-header" product="Community Management" />
      <router-view v-slot="{ Component }">
        <transition>
          <component :is="Component" v-if="Component" />
        </transition>
      </router-view>

      <div id="teleport-modal" />
    </div>

    <div class="sm:block md:hidden lg:hidden xl:hidden">
      <app-resize-page />
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import AppResizePage from '@/modules/layout/pages/resize-page.vue';
import { FeatureFlag } from '@/utils/featureFlag';
import config from '@/config';
import { Auth0Service } from '@/modules/auth/services/auth0.service';
import { mapActions as piniaMapActions, storeToRefs } from 'pinia';
import { useActivityStore } from '@/modules/activity/store/pinia';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { TenantService } from '@/modules/tenant/tenant-service';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { AuthService } from '@/modules/auth/services/auth.service';

export default {
  name: 'App',

  components: {
    AppResizePage,
  },

  setup() {
    const authStore = useAuthStore();
    const { init } = authStore;
    const { tenant } = storeToRefs(authStore);
    return { init, tenant };
  },

  computed: {
    ...mapState({
      featureFlag: (state) => state.tenant.featureFlag,
    }),
    loading() {
      return (
        !((this.isAuthenticated && !!AuthService.getToken())
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
          await TenantService.fetchAndApply();

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
    tenant: {
      handler(tenant, oldTenant) {
        if (tenant?.id && tenant.id !== oldTenant?.id) {
          this.fetchActivityTypes();
          this.fetchActivityChannels();
        }
      },
    },
  },

  async created() {
    FeatureFlag.init(this.tenant);

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    this.init();
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
