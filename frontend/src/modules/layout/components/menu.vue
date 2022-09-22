<template>
  <el-aside
    :width="asideWidth"
    class="flex flex-col flex-1 h-full"
  >
    <router-link
      to="/"
      :class="collapsed ? 'logo logo--collapsed' : 'logo'"
    >
      <transition-group name="fade" mode="in-out">
        <img
          v-if="collapsed"
          key="icon"
          src="/images/icon.png"
          alt="crowd.dev icon"
        />
        <img
          v-else
          key="logo"
          src="/images/logo.png"
          alt="crowd.dev logo"
        />
      </transition-group>
    </router-link>

    <el-menu
      :class="{
        'el-menu-side-nav': true,
        collapsed: collapsed
      }"
      :collapse="collapsed"
      :collapse-transition="false"
      :router="true"
      @select="collapseMenuIfMobile()"
    >
      <el-menu-item
        id="menu-dashboard"
        :class="classFor('/', true)"
        :route="{ path: '/' }"
        index="/"
      >
        <i
          class="ri-lg ri-home-4-line"
          :class="collapsed ? '' : 'mr-2'"
        ></i>
        <template #title>
          <app-i18n code="dashboard.menu"></app-i18n>
        </template>
      </el-menu-item>

      <el-menu-item
        v-if="
          hasPermissionToCommunityMember ||
          communityMemberLocked
        "
        id="menu-members"
        :class="classFor('/members')"
        :route="{ path: '/members' }"
        index="/members"
        :disabled="communityMemberLocked"
      >
        <i
          class="ri-lg ri-user-star-line"
          :class="collapsed ? '' : 'mr-2'"
        ></i>
        <template #title>
          <app-i18n
            code="entities.communityMember.menu"
          ></app-i18n>
        </template>
      </el-menu-item>

      <el-menu-item
        v-if="hasPermissionToActivity || activityLocked"
        id="menu-activities"
        :class="classFor('/activities')"
        :route="{ path: '/activities' }"
        index="/activities"
        :disabled="activityLocked"
      >
        <i
          class="ri-lg ri-radar-line"
          :class="collapsed ? '' : 'mr-2'"
        ></i>
        <template #title>
          <app-i18n
            code="entities.activity.menu"
          ></app-i18n>
        </template>
      </el-menu-item>

      <el-menu-item
        id="menu-conversations"
        :class="classFor('/conversations')"
        :route="{ path: '/conversations' }"
        index="/conversations"
      >
        <i
          class="ri-question-answer-line ri-lg"
          :class="collapsed ? '' : 'mr-2'"
        ></i>
        <template #title>Conversations </template>
      </el-menu-item>

      <el-menu-item
        v-if="hasPermissionToEagleEye || eagleEyeLocked"
        id="menu-eagle-eye"
        :class="classFor('/eagle-eye')"
        :route="{ path: '/eagle-eye' }"
        index="/eagle-eye"
        :disabled="eagleEyeLocked"
      >
        <i
          class="ri-lg ri-search-eye-line"
          :class="collapsed ? '' : 'mr-2'"
        ></i>
        <template #title>
          <app-i18n
            code="entities.eagleEye.menu"
          ></app-i18n>
        </template>
      </el-menu-item>
      <el-menu-item
        v-if="hasPermissionToReport || reportLocked"
        id="menu-reports"
        :class="classFor('/reports')"
        :route="{ path: '/reports' }"
        index="/reports"
        :disabled="reportLocked"
      >
        <i
          class="ri-lg ri-bar-chart-grouped-line"
          :class="collapsed ? '' : 'mr-2'"
        ></i>
        <template #title>
          <app-i18n code="entities.report.menu"></app-i18n>
        </template>
      </el-menu-item>
      <div
        v-if="hasPermissionToSettings || settingsLocked"
        class="h-px w-100 my-2 bg-white opacity-10"
      ></div>
      <el-menu-item
        v-if="hasPermissionToSettings || settingsLocked"
        id="menu-settings"
        :class="classFor('/settings')"
        :route="{ path: '/settings' }"
        index="/settings"
        :disabled="settingsLocked"
      >
        <i
          class="ri-lg ri-settings-2-line"
          :class="collapsed ? '' : 'mr-2'"
        ></i>
        <template #title>
          <app-i18n code="settings.menu"></app-i18n>
        </template>
      </el-menu-item>
    </el-menu>
    <ul class="relative flex flex-col">
      <li id="menu-docs" role="menuitem">
        <el-tooltip
          :disabled="!collapsed"
          effect="dark"
          placement="right"
          content="Docs"
        >
          <a
            class="el-menu-item"
            href="https://docs.crowd.dev"
            target="_blank"
          >
            <i
              class="ri-lg ri-question-line"
              :class="collapsed ? '' : 'mr-2'"
            ></i>
            <span v-if="!collapsed">Docs</span>
          </a>
        </el-tooltip>
      </li>
      <li id="menu-discord" role="menuitem">
        <el-tooltip
          :disabled="!collapsed"
          effect="dark"
          placement="right"
          content="Community"
        >
          <a
            class="el-menu-item"
            href="http://crowd.dev/discord"
            target="_blank"
          >
            <i
              class="ri-lg ri-discord-line"
              :class="collapsed ? '' : 'mr-2'"
            ></i>
            <span v-if="!collapsed">Community</span>
          </a>
        </el-tooltip>
      </li>
      <!--<li role="menuitem" tabindex="-1" id="menu-feedback">
        <el-tooltip
          :disabled="!collapsed"
          effect="dark"
          placement="right"
          content="Product Feedback"
        >
          <a
            class="el-menu-item"
            href="http://crowd.dev/feedback"
            target="_blank"
          >
            <i
              class="ri-lg ri-feedback-line"
              :class="collapsed ? '' : 'mr-2'"
            ></i>
            <span v-if="!collapsed">Product Feedback</span>
          </a>
        </el-tooltip>
      </li>-->

      <li
        role="menuitem"
        class="w-full"
        :class="collapsed ? 'px-3 py-4' : 'px-4 py-2'"
      >
        <el-tooltip
          :disabled="!collapsed"
          effect="dark"
          placement="right"
          content="Free Beta Plan"
        >
          <el-button
            class="btn btn--secondary btn--menu-cta btn--sm w-full"
            :disabled="true"
          >
            <i class="ri-star-fill"></i>
            <span v-if="!collapsed" class="ml-1"
              >Free Beta Plan</span
            >
          </el-button>
        </el-tooltip>
      </li>
      <app-account-dropdown :collapsed="collapsed" />
    </ul>

    <el-tooltip
      :content="collapsed ? 'Expand Menu' : 'Collapse Menu'"
      placement="right"
    >
      <button
        class="button-toggle-menu el-menu-item"
        :style="{ left: asideWidth }"
        @click="toggleMenu"
      >
        <i
          :class="`ri-lg -ml-1 ${
            collapsed
              ? 'ri-arrow-right-s-line'
              : 'ri-arrow-left-s-line'
          }`"
        ></i>
      </button>
    </el-tooltip>
  </el-aside>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { SettingsPermissions } from '@/modules/settings/settings-permissions'
import { UserPermissions } from '@/premium/user/user-permissions'
import { ReportPermissions } from '@/modules/report/report-permissions'
import { CommunityMemberPermissions } from '@/modules/community-member/community-member-permissions'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'
import { EagleEyePermissions } from '@/premium/eagle-eye/eagle-eye-permissions'
import AppAccountDropdown from './account-dropdown'

export default {
  name: 'AppMenu',
  components: { AppAccountDropdown },
  computed: {
    ...mapGetters({
      collapsed: 'layout/menuCollapsed',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant'
    }),

    hasPermissionToSettings() {
      return new SettingsPermissions(
        this.currentTenant,
        this.currentUser
      ).edit
    },

    hasPermissionToUser() {
      return new UserPermissions(
        this.currentTenant,
        this.currentUser
      ).read
    },

    hasPermissionToCommunityMember() {
      return new CommunityMemberPermissions(
        this.currentTenant,
        this.currentUser
      ).read
    },

    hasPermissionToActivity() {
      return new ActivityPermissions(
        this.currentTenant,
        this.currentUser
      ).read
    },

    hasPermissionToReport() {
      return new ReportPermissions(
        this.currentTenant,
        this.currentUser
      ).read
    },

    hasPermissionToEagleEye() {
      return new EagleEyePermissions(
        this.currentTenant,
        this.currentUser
      ).read
    },

    settingsLocked() {
      return new SettingsPermissions(
        this.currentTenant,
        this.currentUser
      ).lockedForCurrentPlan
    },

    userLocked() {
      return new UserPermissions(
        this.currentTenant,
        this.currentUser
      ).lockedForCurrentPlan
    },

    communityMemberLocked() {
      return new CommunityMemberPermissions(
        this.currentTenant,
        this.currentUser
      ).lockedForCurrentPlan
    },

    activityLocked() {
      return new ActivityPermissions(
        this.currentTenant,
        this.currentUser
      ).lockedForCurrentPlan
    },

    reportLocked() {
      return new ReportPermissions(
        this.currentTenant,
        this.currentUser
      ).lockedForCurrentPlan
    },

    eagleEyeLocked() {
      return new EagleEyePermissions(
        this.currentTenant,
        this.currentUser
      ).lockedForCurrentPlan
    },

    asideWidth() {
      if (this.isMobile && !this.collapsed) {
        return '100%'
      }

      if (!this.collapsed) {
        return '210px'
      }

      return '64px'
    }
  },

  methods: {
    ...mapActions({
      toggleMenu: 'layout/toggleMenu',
      collapseMenu: 'layout/collapseMenu'
    }),

    collapseMenuIfMobile() {
      if (this.isMobile) {
        this.collapseMenu()
      }
    },

    classFor(path, exact = false) {
      if (exact) {
        return {
          active: this.$route.path === path
        }
      }

      const routePath = this.$route.path
      const active =
        routePath === path ||
        routePath.startsWith(path + '/')

      return {
        active
      }
    },
    handleExternalLinkClick(path) {
      window.open(`http://crowd.dev/${path}`)
    }
  }
}
</script>

<style scoped lang="scss">
.el-menu.collapsed span {
  visibility: hidden;
}

.logo {
  @apply flex items-center justify-center py-6;

  img {
    @apply h-6;
  }

  &.logo--collapsed {
    @apply py-4;
  }
}

.button-toggle-menu {
  @apply fixed top-0 h-12 w-3 text-white z-10 opacity-50 rounded-r-md p-0;
  top: 200px;

  &:hover {
    @apply opacity-75;
  }

  &,
  &:hover,
  &:focus {
    background-color: #140505;
  }
}
</style>
