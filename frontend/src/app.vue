<template>
  <div id="app">
    <div class="sm:hidden md:block lg:block xl:block">
      <lfx-header-v2 v-if="!$route.meta.hideLfxHeader" id="lfx-header" product="Community Management" />
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
    <lf-globals />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import AppResizePage from '@/modules/layout/pages/resize-page.vue';
import { FeatureFlag } from '@/utils/featureFlag';
import { mapActions as piniaMapActions, storeToRefs } from 'pinia';
import { useActivityStore } from '@/modules/activity/store/pinia';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import useSessionTracking from '@/shared/modules/monitoring/useSessionTracking';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import LfGlobals from '@/shared/components/globals.vue';

export default {
  name: 'App',

  components: {
    LfGlobals,
    AppResizePage,
  },

  setup() {
    const authStore = useAuthStore();
    const { detachListeners } = useSessionTracking();
    const { listProjectGroups } = useLfSegmentsStore();
    const { init } = authStore;
    const { tenant, loaded } = storeToRefs(authStore);
    return {
      init, tenant, loaded, detachListeners, listProjectGroups,
    };
  },

  computed: {
    ...mapState({
      featureFlag: (state) => state.tenant.featureFlag,
    }),
  },

  watch: {
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
    const queryParameters = new URLSearchParams(window.location.search);
    if (queryParameters.get('state') === 'noconnect' && window.location.pathname.includes('/integration')) {
      return;
    }
    this.listProjectGroups({
      limit: null,
      reset: true,
    });
    if (['/auth/callback'].includes(window.location.pathname)) {
      return;
    }
    this.init();
  },

  unmounted() {
    this.detachListeners();
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
