<template>
  <el-aside class="app-menu" width="fit-content">
    <el-menu
      class="flex flex-col h-full border-gray-200"
      :default-active="$route.path"
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
            src="/images/logo-all-black.png"
            alt="crowd.dev logo"
          />
        </router-link>
        <el-button
          class="btn btn--icon--sm btn--transparent custom-btn"
          @click="toggleMenu"
        >
          <i
            class="ri-layout-left-2-line text-lg leading-none text-gray-300"
          ></i>
        </el-button>
      </div>

      <!-- Menu dynamic logo -->
      <div
        class="h-14 flex items-center justify-center menu-collapsed-header"
      >
        <img
          key="icon"
          class="h-5 w-auto dynamic-logo"
          src="/images/icon-all-black.png"
          alt="crowd.dev icon"
        />

        <!-- Menu expand button -->
        <el-button
          class="btn btn--icon--sm btn--transparent expand-btn custom-btn"
          @click="toggleMenu"
        >
          <i
            class="ri-arrow-right-s-line text-lg leading-none text-gray-300"
          ></i>
        </el-button>
      </div>

      <div class="px-3 pt-3 flex flex-col gap-2 grow">
        <!-- Menu items -->
        <el-menu-item
          id="menu-dashboard"
          index="/"
          :route="{ path: '/' }"
        >
          <i class="ri-home-5-line"></i>
          <template #title
            ><app-i18n code="dashboard.menu"></app-i18n
          ></template>
        </el-menu-item>
        <el-menu-item
          v-if="
            hasPermissionToCommunityMember ||
            isCommunityMemberLocked
          "
          id="menu-members"
          index="/members"
          :route="{ path: '/members' }"
          :disabled="isCommunityMemberLocked"
        >
          <i class="ri-contacts-line"></i>
          <template #title
            ><app-i18n
              code="entities.communityMember.menu"
            ></app-i18n
          ></template>
        </el-menu-item>
        <el-menu-item
          v-if="hasPermissionToActivity || isActivityLocked"
          id="menu-activities"
          index="/activities"
          :route="{ path: '/activities' }"
          :disabled="isActivityLocked"
        >
          <i class="ri-radar-line"></i>
          <template #title
            ><app-i18n
              code="entities.activity.menu"
            ></app-i18n
          ></template>
        </el-menu-item>
        <el-menu-item
          id="menu-conversations"
          index="/conversations"
          :route="{ path: '/conversations' }"
        >
          <i class="ri-question-answer-line"></i>
          <template #title
            ><app-i18n
              code="entities.conversation.menu"
            ></app-i18n
          ></template>
        </el-menu-item>
        <el-menu-item
          v-if="hasPermissionToEagleEye || isEagleEyeLocked"
          id="menu-eagle-eye"
          index="/eagle-eye"
          :route="{ path: '/eagle-eye' }"
          :disabled="isEagleEyeLocked"
        >
          <i class="ri-search-eye-line"></i>
          <template #title
            ><app-i18n
              code="entities.eagleEye.menu"
            ></app-i18n
          ></template>
        </el-menu-item>
        <el-menu-item
          v-if="hasPermissionToReport || isReportLocked"
          id="menu-reports"
          index="/reports"
          :route="{ path: '/reports' }"
          :disabled="isReportLocked"
        >
          <i class="ri-bar-chart-line"></i>
          <template #title
            ><app-i18n
              code="entities.report.menu"
            ></app-i18n
          ></template>
        </el-menu-item>

        <!-- External links -->
        <el-divider
          v-if="hasPermissionToSettings || isSettingsLocked"
          class="border-gray-200"
        />
        <el-menu-item
          v-if="hasPermissionToSettings || isSettingsLocked"
          id="menu-settings"
          index="/settings"
          :route="{ path: '/settings' }"
          :disabled="isSettingsLocked"
        >
          <i class="ri-settings-3-line"></i>
          <template #title
            ><app-i18n code="settings.menu"></app-i18n
          ></template>
        </el-menu-item>

        <div class="grow"></div>

        <!-- External link menu items -->
        <ul class="relative flex flex-col gap-2">
          <li
            id="menu-docs"
            role="menuitem"
            class="custom-menu-item"
          >
            <el-tooltip
              :disabled="!isCollapsed"
              effect="dark"
              placement="right"
              raw-content
              popper-class="custom-menu-tooltip"
              content="Docs <i class='ri-external-link-line ml-1.1'></i>"
            >
              <a
                class="el-menu-item justify-between"
                href="https://docs.crowd.dev"
                target="_blank"
              >
                <div class="flex gap-3">
                  <i class="ri-question-line"></i>
                  <span v-if="!isCollapsed">
                    <app-i18n
                      code="external.docs"
                    ></app-i18n
                  ></span>
                </div>

                <i
                  v-if="!isCollapsed"
                  class="item-link ri-external-link-line !text-gray-300"
                ></i>
              </a>
            </el-tooltip>
          </li>
          <li
            id="menu-discord"
            role="menuitem"
            class="custom-menu-item"
          >
            <el-tooltip
              :disabled="!isCollapsed"
              effect="dark"
              placement="right"
              raw-content
              popper-class="custom-menu-tooltip"
              content="Community <i class='ri-external-link-line ml-1.1'></i>"
            >
              <a
                class="el-menu-item justify-between relative"
                href="http://crowd.dev/discord"
                target="_blank"
              >
                <div class="flex gap-3">
                  <i class="ri-lg ri-discord-line"></i>
                  <span v-if="!isCollapsed"
                    ><app-i18n
                      code="external.community"
                    ></app-i18n
                  ></span>
                </div>

                <i
                  v-if="!isCollapsed"
                  class="item-link ri-external-link-line !text-gray-300"
                ></i>
              </a>
            </el-tooltip>
          </li>
        </ul>

        <el-divider class="border-gray-200 !mb-0" />
      </div>

      <!-- User Account -->
      <app-account-dropdown />
    </el-menu>
  </el-aside>
</template>

<script>
export default {
  name: 'AppMenu'
}
</script>

<script setup>
import { useStore } from 'vuex'
import { SettingsPermissions } from '@/modules/settings/settings-permissions'
import { ReportPermissions } from '@/modules/report/report-permissions'
import { CommunityMemberPermissions } from '@/modules/community-member/community-member-permissions'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'
import { EagleEyePermissions } from '@/premium/eagle-eye/eagle-eye-permissions'
import AppAccountDropdown from './account-dropdown'
import { computed } from 'vue'

const store = useStore()
const isCollapsed = computed(
  () => store.getters['layout/menuCollapsed']
)
const currentUser = computed(
  () => store.getters['auth/currentUser']
)
const currentTenant = computed(
  () => store.getters['auth/currentTenant']
)

function toggleMenu() {
  store.dispatch('layout/toggleMenu')
}

const hasPermissionToSettings = computed(
  () =>
    new SettingsPermissions(
      currentTenant.value,
      currentUser.value
    ).edit
)

const hasPermissionToCommunityMember = computed(
  () =>
    new CommunityMemberPermissions(
      currentTenant.value,
      currentUser.value
    ).read
)

const hasPermissionToActivity = computed(
  () =>
    new ActivityPermissions(
      currentTenant.value,
      currentUser.value
    ).read
)

const hasPermissionToReport = computed(
  () =>
    new ReportPermissions(
      currentTenant.value,
      currentUser.value
    ).read
)

const hasPermissionToEagleEye = computed(
  () =>
    new EagleEyePermissions(
      currentTenant.value,
      currentUser.value
    ).read
)

const isSettingsLocked = computed(
  () =>
    new SettingsPermissions(
      currentTenant.value,
      currentUser.value
    ).lockedForCurrentPlan
)

const isCommunityMemberLocked = computed(
  () =>
    new CommunityMemberPermissions(
      currentTenant.value,
      currentUser.value
    ).lockedForCurrentPlan
)

const isActivityLocked = computed(
  () =>
    new ActivityPermissions(
      currentTenant.value,
      currentUser.value
    ).lockedForCurrentPlan
)

const isReportLocked = computed(
  () =>
    new ReportPermissions(
      currentTenant.value,
      currentUser.value
    ).lockedForCurrentPlan
)

const isEagleEyeLocked = computed(
  () =>
    new EagleEyePermissions(
      currentTenant.value,
      currentUser.value
    ).lockedForCurrentPlan
)
</script>

<style lang="scss">
.app-menu {
  @apply bg-white flex flex-col min-h-screen;

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
</style>
