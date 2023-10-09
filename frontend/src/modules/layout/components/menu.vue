<template>
  <el-aside class="app-menu" width="fit-content">
    <el-menu
      class="flex flex-col h-full border-gray-200"
      :collapse="isCollapsed"
      :router="true"
    >
      <!-- Menu logo header -->
      <div
        class="h-14 pl-6 pr-3 flex items-center justify-between menu-expanded-header"
      >
        <router-link to="/">
          <img
            key="logo"
            class="h-5 w-auto"
            src="/images/logo/crowd.svg"
            alt="crowd.dev logo"
          />
        </router-link>
        <el-button
          class="btn btn--icon--sm btn--transparent custom-btn"
          @click="toggleMenu"
        >
          <i
            class="ri-layout-left-2-line text-lg leading-none text-gray-300"
          />
        </el-button>
      </div>

      <!-- Menu dynamic logo -->
      <div
        class="h-14 flex items-center justify-center menu-collapsed-header"
      >
        <img
          key="icon"
          class="h-5 w-auto dynamic-logo"
          src="/icons/logo/crowd.svg"
          alt="crowd.dev icon"
        />

        <!-- Menu expand button -->
        <el-button
          class="btn btn--icon--sm btn--transparent expand-btn custom-btn"
          @click="toggleMenu"
        >
          <i
            class="ri-arrow-right-s-line text-lg leading-none text-gray-300"
          />
        </el-button>
      </div>

      <!-- Workspace Dropdown -->
      <app-workspace-dropdown v-if="currentTenant" />

      <div class="px-3 pt-3 flex flex-col gap-2 grow">
        <!-- Menu items -->
        <!-- Home -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          :content="i18n('dashboard.menu')"
        >
          <router-link
            id="menu-dashboard"
            :to="{ path: '/' }"
            class="el-menu-item"
            :class="classFor('/', true)"
          >
            <i class="ri-home-5-line" />
            <span v-if="!isCollapsed">
              <app-i18n code="dashboard.menu" />
            </span>
          </router-link>
        </el-tooltip>

        <!-- Tasks -->
        <el-tooltip
          :disabled="!isCollapsed"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          content="Tasks"
        >
          <router-link
            v-if="hasPermissionToTask || isTaskLocked"
            id="menu-task"
            :to="{ path: '/task' }"
            class="el-menu-item"
            :class="classFor('/task')"
          >
            <div
              class="flex justify-between items-center w-full"
            >
              <div>
                <i class="ri-checkbox-multiple-line" />
                <span v-if="!isCollapsed" class="pl-2">
                  Tasks
                </span>
              </div>
              <div
                v-if="!isCollapsed && myOpenTasksCount > 0"
                class="task-badge"
              >
                {{ myOpenTasksCount }}
              </div>
            </div>
          </router-link>
        </el-tooltip>

        <!-- Members -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          :content="i18n('entities.member.menu')"
        >
          <router-link
            v-if="
              hasPermissionToCommunityMember
                || isCommunityMemberLocked
            "
            id="menu-members"
            :to="{ path: '/contacts' }"
            class="el-menu-item"
            :class="classFor('/contacts')"
            :disabled="isCommunityMemberLocked"
          >
            <i class="ri-contacts-line" />
            <span v-if="!isCollapsed">
              <app-i18n
                code="entities.member.menu"
              />
            </span>
          </router-link>
        </el-tooltip>

        <!-- Organizations -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          :content="i18n('entities.organization.menu')"
        >
          <router-link
            id="menu-organizations"
            :to="{ path: '/organizations' }"
            class="el-menu-item"
            :class="classFor('/organizations')"
          >
            <i class="ri-community-line" />
            <span v-if="!isCollapsed">
              <app-i18n
                code="entities.organization.menu"
              />
            </span>
          </router-link>
        </el-tooltip>

        <!-- Activities -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          :content="i18n('entities.activity.menu')"
        >
          <router-link
            v-if="
              hasPermissionToActivity || isActivityLocked
            "
            id="menu-activities"
            :to="{ path: '/activities' }"
            class="el-menu-item"
            :class="classFor('/activities')"
            :disabled="isActivityLocked"
          >
            <i class="ri-radar-line" />
            <span v-if="!isCollapsed">
              <app-i18n
                code="entities.activity.menu"
              />
            </span>
          </router-link>
        </el-tooltip>

        <!-- Reports -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          :content="i18n('entities.report.menu')"
        >
          <router-link
            v-if="hasPermissionToReport || isReportLocked"
            id="menu-reports"
            :to="{ path: '/reports' }"
            class="el-menu-item"
            :class="classFor('/reports')"
            :disabled="isReportLocked"
          >
            <i class="ri-bar-chart-line" />
            <span v-if="!isCollapsed">
              <app-i18n
                code="entities.report.menu"
              />
            </span>
          </router-link>
        </el-tooltip>

        <!-- External links -->
        <el-divider class="border-gray-200" />

        <!-- Eagle eye -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          :content="i18n('entities.eagleEye.menu')"
        >
          <router-link
            v-if="
              hasPermissionToEagleEye || isEagleEyeLocked
            "
            id="menu-eagle-eye"
            :to="{ path: '/eagle-eye' }"
            class="el-menu-item"
            :class="classFor('/eagle-eye')"
            :disabled="isEagleEyeLocked"
          >
            <i class="ri-search-eye-line" />
            <span v-if="!isCollapsed">
              <app-i18n
                code="entities.eagleEye.menu"
              />
            </span>
          </router-link>
        </el-tooltip>

        <div class="grow" />

        <!-- Integrations -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          :content="i18n('integrations.menu')"
        >
          <router-link
            id="menu-integrations"
            :to="{ path: '/integrations' }"
            class="el-menu-item"
            :class="classFor('/integrations')"
          >
            <i class="ri-apps-2-line" />
            <span v-if="!isCollapsed">
              <app-i18n code="integrations.menu" />
            </span>
          </router-link>
        </el-tooltip>

        <!-- Settings -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          :content="i18n('settings.menu')"
        >
          <router-link
            v-if="
              hasPermissionToSettings || isSettingsLocked
            "
            id="menu-settings"
            :to="{ path: '/settings' }"
            class="el-menu-item"
            :class="classFor('/settings')"
            :disabled="isSettingsLocked"
          >
            <i class="ri-settings-3-line" />
            <span v-if="!isCollapsed">
              <app-i18n code="settings.menu" /></span>
          </router-link>
        </el-tooltip>

        <!-- Feedback -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          :content="i18n('feedback.menu')"
        >
          <button
            v-if="formbricksEnabled"
            id="menu-feedback"
            type="button"
            class="el-menu-item"
            @click="openFeedbackWidget"
          >
            <i class="ri-feedback-line" />
            <span v-if="!isCollapsed">
              <app-i18n code="feedback.menu" /></span>
          </button>
        </el-tooltip>

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
  name: 'AppMenu',
};
</script>

<style lang="scss">
.app-menu {
  @apply bg-white flex flex-col min-h-screen;

  a,
  a[href]:hover {
    @apply text-gray-900;
  }

  // Logo switch

  .dynamic-logo {
    display: block;
  }

  .expand-btn {
    display: none;
  }

  .el-menu:hover:not(.horizontal-collapse-transition).el-menu--collapse {
    .dynamic-logo {
      display: none;
    }

    .expand-btn {
      display: block;
    }
  }

  // Menu item
  .el-menu-item {
    @apply px-2.5 h-10 gap-3 leading-normal rounded-md;

    i {
      @apply text-gray-400 text-lg leading-none;
    }

    &.is-active {
      @apply bg-brand-50 text-gray-900 font-medium;

      i {
        @apply text-brand-500;
      }
    }

    &:hover {
      @apply bg-gray-50;

      i {
        @apply text-gray-500;
      }
    }
  }

  // Menu width and padding customization
  .el-menu--vertical:not(.el-menu--collapse):not(.el-menu--popup-container) {
    width: 260px;

    .menu-collapsed-header {
      display: none;
    }
  }

  .el-menu--vertical:not(.el-menu--collapse):not(.el-menu--popup-container)
    .el-menu-item {
    @apply px-2.5;
  }

  .el-menu--vertical.el-menu--collapse {
    .menu-expanded-header {
      display: none;
    }
  }

  // Override divider margin
  .el-divider--horizontal {
    @apply my-1;
  }

  // Custom Menu items
  .item-link {
    display: none;
  }

  .custom-menu-item:hover {
    .item-link {
      display: block;
    }
  }
  .custom-btn {
    @apply h-8 w-8;

    &:hover i {
      @apply text-gray-500;
    }
  }

  .horizontal-collapse-transition .custom-btn {
    display: none;
  }

  .horizontal-collapse-transition .expand-btn {
    display: none;
  }

  a[href]:hover {
    opacity: 1;
  }

  // Image animations
  img {
    transition: opacity 0.3s ease;
    opacity: 1;
  }

  .v-enter-active img,
  .v-leave-active img {
    opacity: 0;
  }
}

// Custom tooltip for external links
.custom-menu-tooltip {
  margin-left: 8px !important;

  span:first-child {
    @apply flex gap-1.5 items-center;
  }
}

// Menu popovers
.popover-item.selected {
  background-color: rgba(253, 237, 234, 0.5);

  & .plan {
    @apply text-brand-400;
  }
}

.task-badge {
  @apply h-5 flex items-center px-2 bg-gray-100 rounded-full text-2xs font-medium;
}

.el-menu-item.is-active .task-badge {
  @apply bg-brand-100;
}
</style>
