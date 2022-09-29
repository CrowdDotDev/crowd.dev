<template>
  <el-popover
    placement="right-end"
    :width="230"
    trigger="click"
    popper-class="workspace-popover"
  >
    <template #reference>
      <div
        class="cursor-pointer flex w-full h-16 items-center bg-white hover:bg-gray-50 account-btn"
      >
        <div class="flex items-center">
          <app-avatar
            :entity="computedAvatarEntity"
            size="sm"
            :class="isCollapsed ? '' : 'mr-3'"
          ></app-avatar>
          <div
            v-if="!isCollapsed"
            class="text-sm account-btn-info"
          >
            <div class="text-gray-900">
              {{ currentUserNameOrEmailPrefix }}
            </div>
            <div class="text-gray-500 text-2xs">
              {{ currentTenant.name }}
            </div>
          </div>
        </div>

        <i
          v-if="!isCollapsed"
          class="ri-more-2-fill text-gray-300 text-lg"
        ></i>
      </div>
    </template>

    <!-- Popover content -->
    <div
      class="text-2xs font-medium tracking-wide text-gray-400 pl-4 pb-1"
    >
      WORKSPACE
    </div>
    <div v-if="currentTenant && currentTenant.onboardedAt">
      <div class="popover-item" @click="doEditProfile">
        <i class="text-base text-gray-400 ri-user-line"></i>
        <span class="text-xs text-gray-900"
          ><app-i18n code="auth.profile.title"></app-i18n
        ></span>
      </div>
      <div class="popover-item" @click="doPasswordChange">
        <i
          class="text-base text-gray-400 ri-lock-password-line"
        ></i>
        <span class="text-xs text-gray-900"
          ><app-i18n
            code="auth.passwordChange.title"
          ></app-i18n
        ></span>
      </div>
      <div
        v-if="
          ['multi', 'multi-with-subdomain'].includes(
            tenantMode
          ) && hasTenantModule
        "
        class="popover-item"
        @click="doSwitchTenants"
      >
        <i class="text-base text-gray-400 ri-apps-line"></i>
        <span class="text-xs text-gray-900"
          >Workspaces</span
        >
      </div>
    </div>
    <div class="popover-item" @click="doSignout">
      <i
        class="text-base text-gray-400 ri-logout-box-r-line"
      ></i>
      <span class="text-xs text-gray-900"
        ><app-i18n code="auth.signout"></app-i18n
      ></span>
    </div>
  </el-popover>
</template>

<script>
import config from '@/config'
import { mapGetters, mapActions } from 'vuex'
import { i18n } from '@/i18n'

export default {
  name: 'AppAccountDropdown',

  computed: {
    ...mapGetters({
      isCollapsed: 'layout/menuCollapsed',
      currentUserNameOrEmailPrefix:
        'auth/currentUserNameOrEmailPrefix',
      currentUserAvatar: 'auth/currentUserAvatar',
      currentTenant: 'auth/currentTenant',
      isMobile: 'layout/isMobile'
    }),

    hasTenantModule() {
      return config.edition === 'crowd-hosted'
        ? true
        : config.communityPremium === 'true'
    },

    tenantMode() {
      return config.tenantMode
    },

    computedAvatarEntity() {
      return {
        avatar: this.currentUserAvatar,
        username: {
          crowdUsername: this.currentUserNameOrEmailPrefix
        }
      }
    }
  },

  methods: {
    ...mapActions({
      doSignout: 'auth/doSignout'
    }),

    i18n(key, args) {
      return i18n(key, args)
    },

    doEditProfile() {
      return this.$router.push('/auth/edit-profile')
    },

    doPasswordChange() {
      return this.$router.push('/password-change')
    },

    doSwitchTenants() {
      return this.$router.push('/tenant')
    }
  }
}
</script>

<style lang="scss">
.popover-item {
  @apply h-12 hover:cursor-pointer flex items-center gap-3 px-4 hover:bg-gray-50;

  &:hover {
    i {
      @apply text-gray-500;
    }
  }
}

// Override inline style in popover
.workspace-popover {
  padding: 8px 0 !important;
  left: 1px !important;
  bottom: 10px !important;
  border-radius: 8px !important;
  border: none !important;
  box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.2) !important;
}

// Smooth disappearance of account information on collapse
.app-menu {
  .account-btn {
    @apply justify-between px-3;
  }

  :not(.horizontal-collapse-transition).el-menu--collapse {
    @apply justify-center;
  }

  .horizontal-collapse-transition .account-btn-info {
    transition: opacity 0.3s ease;
    opacity: 0;
  }
}
</style>
