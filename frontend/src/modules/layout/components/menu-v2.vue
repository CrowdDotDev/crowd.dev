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

      <div class="px-3 pt-3 flex flex-col gap-2 grow">
        <!-- Menu items -->
        <cr-menu-links :links="mainMenu" :collapsed="isCollapsed"/>


        <!-- Eagle eye -->


        <div class="grow" />

        <cr-menu-links :links="bottomMenu" :collapsed="isCollapsed" />
        <!-- Support popover -->
        <app-support-dropdown />
      </div>

      <!-- User Account -->
      <div class="mt-3">
        <app-account-dropdown />
      </div>
    </el-menu>
  </el-aside>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed, watch } from 'vue';
import { RouterLink, useLink } from 'vue-router';
import { SettingsPermissions } from '@/modules/settings/settings-permissions';
import { ReportPermissions } from '@/modules/report/report-permissions';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { ActivityPermissions } from '@/modules/activity/activity-permissions';
import { EagleEyePermissions } from '@/premium/eagle-eye/eagle-eye-permissions';
import { i18n } from '@/i18n';
import config from '@/config';

import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { TaskPermissions } from '@/modules/task/task-permissions';
import formbricks from '@/plugins/formbricks';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import AppWorkspaceDropdown from './workspace-dropdown.vue';
import AppSupportDropdown from './support-dropdown.vue';
import AppAccountDropdown from './account-dropdown.vue';
import AppWorkspaceDropdownV2 from '@/modules/layout/components/menu/menu-workspace.vue';
import AppMenuHeader from '@/modules/layout/components/menu/menu-header.vue';
import CrMenuHeader from '@/modules/layout/components/menu/menu-header.vue';
import CrMenuWorkspace from '@/modules/layout/components/menu/menu-workspace.vue';
import CrMenuLinks from '@/modules/layout/components/menu/menu-links.vue';
import { bottomMenu, mainMenu } from '@/modules/layout/config/menu';

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

const { route } = useLink(RouterLink.props);
const isCollapsed = computed(
  () => store.getters['layout/menuCollapsed'],
);
const currentUser = computed(
  () => store.getters['auth/currentUser'],
);

function toggleMenu() {
  store.dispatch('layout/toggleMenu');
}

const formbricksEnabled = computed(
  () => i18n('feedback.menu') !== 'feedback.menu'
    && config.formbricks.url && config.formbricks.environmentId,
);

const { myOpenTasksCount } = mapGetters('task');

const hasPermissionToSettings = computed(
  () => new SettingsPermissions(
    currentTenant.value,
    currentUser.value,
  ).edit || currentTenant.value?.hasSampleData,
);

const hasPermissionToCommunityMember = computed(
  () => new MemberPermissions(
    currentTenant.value,
    currentUser.value,
  ).read,
);

const hasPermissionToTask = computed(
  () => new TaskPermissions(
    currentTenant.value,
    currentUser.value,
  ).read,
);

const hasPermissionToActivity = computed(
  () => new ActivityPermissions(
    currentTenant.value,
    currentUser.value,
  ).read,
);

const hasPermissionToReport = computed(
  () => new ReportPermissions(
    currentTenant.value,
    currentUser.value,
  ).read,
);

const hasPermissionToEagleEye = computed(
  () => new EagleEyePermissions(
    currentTenant.value,
    currentUser.value,
  ).read,
);

const isSettingsLocked = computed(
  () => new SettingsPermissions(
    currentTenant.value,
    currentUser.value,
  ).lockedForCurrentPlan,
);

const isCommunityMemberLocked = computed(
  () => new MemberPermissions(
    currentTenant.value,
    currentUser.value,
  ).lockedForCurrentPlan,
);

const isTaskLocked = computed(
  () => new TaskPermissions(
    currentTenant.value,
    currentUser.value,
  ).lockedForCurrentPlan,
);

const isActivityLocked = computed(
  () => new ActivityPermissions(
    currentTenant.value,
    currentUser.value,
  ).lockedForCurrentPlan,
);

const isReportLocked = computed(
  () => new ReportPermissions(
    currentTenant.value,
    currentUser.value,
  ).lockedForCurrentPlan,
);

const isEagleEyeLocked = computed(
  () => new EagleEyePermissions(
    currentTenant.value,
    currentUser.value,
  ).lockedForCurrentPlan,
);

const classFor = (path, exact = false) => {
  if (exact) {
    return {
      'is-active': route.value.path === path,
    };
  }

  const routePath = route.value.path;
  const active = routePath === path || routePath.startsWith(`${path}/`);
  return {
    'is-active': active,
  };
};

const openFeedbackWidget = () => {
  formbricks.track('openFeedback');
};
</script>

<script>
export default {
  name: 'CrMenu',
};
</script>

<style lang="scss">
</style>
