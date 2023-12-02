<template>
  <el-aside class="crowd-menu min-h-screen" width="fit-content">
    <el-menu
      class="flex flex-col h-full justify-between border-gray-100"
      :collapse="isCollapsed"
      :router="true"
    >
      <!-- Menu logo header -->
      <cr-menu-header :collapsed="isCollapsed" @toggle-menu="toggleMenu()" />

      <!-- Workspace Dropdown -->
      <cr-menu-workspace v-if="currentTenant" />

      <div class="px-3 pt-4 pb-2 flex flex-col grow">
        <cr-menu-quickstart :collapsed="isCollapsed" />

        <!-- Menu items -->
        <cr-menu-links class="mb-2" :links="mainMenu" :collapsed="isCollapsed" link-class="text-sm" />

        <div class="border-t border-gray-200 mb-4" />

        <cr-menu-links :links="bottomMenu" :collapsed="isCollapsed" link-class="text-sm" />

        <div class="grow" />
        <!-- Support popover -->
        <div class="px-1">
          <cr-menu-support :collapsed="isCollapsed" />
        </div>
      </div>
    </el-menu>
  </el-aside>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed } from 'vue';

import { mapGetters } from '@/shared/vuex/vuex.helpers';
import CrMenuHeader from '@/modules/layout/components/menu/menu-header.vue';
import CrMenuWorkspace from '@/modules/layout/components/menu/menu-workspace.vue';
import CrMenuLinks from '@/modules/layout/components/menu/menu-links.vue';
import { bottomMenu, mainMenu } from '@/modules/layout/config/menu';
import CrMenuSupport from '@/modules/layout/components/menu/menu-support.vue';
import CrMenuQuickstart from '@/modules/layout/components/menu/menu-quickstart.vue';

const store = useStore();
const { currentTenant } = mapGetters('auth');

const isCollapsed = computed(
  () => store.getters['layout/menuCollapsed'],
);
function toggleMenu() {
  store.dispatch('layout/toggleMenu');
}

</script>

<script>
export default {
  name: 'CrMenu',
};
</script>

<style lang="scss">
.crowd-menu{
  .el-menu--vertical:not(.el-menu--collapse):not(.el-menu--popup-container) {
    width: 281px;
  }
}
</style>
