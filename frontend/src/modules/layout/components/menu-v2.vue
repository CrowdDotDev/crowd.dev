<template>
  <el-aside class="app-menu" width="fit-content">
    <el-menu
      class="flex flex-col h-full justify-between"
      :collapse="isCollapsed"
      :router="true"
    >
      <!-- Menu logo header -->
      <cr-menu-header :collapsed="isCollapsed" @toggle-menu="toggleMenu()" />

      <!-- Workspace Dropdown -->
      <cr-menu-workspace v-if="currentTenant" />

      <div class="px-3 py-4 flex flex-col grow">
        <!-- Menu items -->
        <cr-menu-links class="mb-2" :links="mainMenu" :collapsed="isCollapsed" />

        <div class="border-t border-gray-100 mb-4" />

        <cr-menu-links :links="bottomMenu" :collapsed="isCollapsed" />

        <div class="grow" />
        <!-- Support popover -->
        <cr-menu-support :collapsed="isCollapsed" />
      </div>
    </el-menu>
  </el-aside>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed, watch } from 'vue';

import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import CrMenuHeader from '@/modules/layout/components/menu/menu-header.vue';
import CrMenuWorkspace from '@/modules/layout/components/menu/menu-workspace.vue';
import CrMenuLinks from '@/modules/layout/components/menu/menu-links.vue';
import { bottomMenu, mainMenu } from '@/modules/layout/config/menu';
import CrMenuSupport from '@/modules/layout/components/menu/menu-support.vue';

const store = useStore();
const { currentTenant } = mapGetters('auth');
const { setTypes } = useActivityTypeStore();

watch(
  () => currentTenant,
  (tenant) => {
    if (tenant.value?.settings.length > 0) {
      setTypes(tenant.value.settings[0].activityTypes);
    }
  },
  { immediate: true, deep: true },
);

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
</style>
