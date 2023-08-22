<template>
  <el-container v-if="currentTenant" class="flex-col">
    <app-lf-header />
    <el-container style="height: calc(100vh - 60px);">
      <!-- App menu -->
      <app-lf-menu />

      <el-container :style="elMainStyle" class="bg-white rounded-tl-2xl">
        <el-main id="main-page-wrapper" class="relative">
          <app-lf-banners />
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </el-container>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import AppLfMenu from '@/modules/lf/layout/components/lf-menu.vue';
import AppLfBanners from '@/modules/lf/layout/components/lf-banners.vue';
import AppLfHeader from '@/modules/lf/layout/components/lf-header.vue';

export default {
  name: 'AppLayout',

  components: {
    AppLfMenu,
    AppLfBanners,
    AppLfHeader,
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      menu: 'layout/menuCollapsed',
    }),
  },

  watch: {
    menu: {
      handler(updatedValue) {
        const param = this.$route.query.menu === 'true' || false;

        if (updatedValue !== param) {
          this.$router.replace({ query: { ...this.$route.query, menu: updatedValue } });
        }
      },
    },
    '$route.query.menu': {
      immediate: true,
      deep: true,
      handler(updatedValue) {
        const param = updatedValue === 'true' || false;

        if (this.menu !== param) {
          this.toggleMenu();
        }
      },
    },
  },

  methods: {
    ...mapActions({
      toggleMenu: 'layout/toggleMenu',
    }),
  },
};
</script>
