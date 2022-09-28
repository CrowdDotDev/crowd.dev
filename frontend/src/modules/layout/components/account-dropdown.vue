<template>
  <el-dropdown
    trigger="click"
    placement="top-end"
    @command="handleDropdownCommand"
  >
    <div class="el-dropdown-link w-full">
      <div
        class="dropdown-content flex w-full h-16 items-center bg-white hover:bg-gray-50"
        :class="
          collapsed
            ? 'justify-center'
            : 'justify-between px-3'
        "
      >
        <div class="flex items-center">
          <app-avatar
            :entity="computedAvatarEntity"
            size="sm"
            :class="collapsed ? '' : 'mr-3'"
          ></app-avatar>
          <div v-if="!collapsed" class="text-sm">
            <div class="text-gray-900">
              {{ currentUserNameOrEmailPrefix }}
            </div>
            <div class="text-gray-500 text-2xs">
              {{ currentTenant.name }}
            </div>
          </div>
        </div>

        <i
          v-if="!collapsed"
          class="ri-more-2-fill text-gray-300 text-lg"
        ></i>
      </div>
    </div>
    <template #dropdown>
      <div
        v-if="currentTenant && currentTenant.onboardedAt"
      >
        <el-dropdown-item command="doEditProfile">
          <i class="ri-user-line mr-1"></i>
          <app-i18n code="auth.profile.title"></app-i18n>
        </el-dropdown-item>
        <el-dropdown-item command="doPasswordChange">
          <i class="ri-lock-password-line mr-1"></i>
          <app-i18n
            code="auth.passwordChange.title"
          ></app-i18n>
        </el-dropdown-item>
        <el-dropdown-item
          v-if="
            ['multi', 'multi-with-subdomain'].includes(
              tenantMode
            ) && hasTenantModule
          "
          command="doSwitchTenants"
        >
          <i class="ri-apps-line mr-1"></i>
          Workspaces
        </el-dropdown-item>
      </div>
      <el-dropdown-item command="doSignout">
        <i class="ri-logout-circle-line mr-1"></i>
        <app-i18n code="auth.signout"></app-i18n>
      </el-dropdown-item>
    </template>
  </el-dropdown>
</template>

<script>
import config from '@/config'
import { mapGetters, mapActions } from 'vuex'
import { i18n } from '@/i18n'

export default {
  name: 'AppAccountDropdown',

  computed: {
    ...mapGetters({
      collapsed: 'layout/menuCollapsed',
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

    handleDropdownCommand(command) {
      if (command === 'doSignout') {
        this.doSignout()
      }

      if (command === 'doEditProfile') {
        this.doEditProfile()
      }

      if (command === 'doSwitchTenants') {
        this.doSwitchTenants()
      }

      if (command === 'doPasswordChange') {
        this.doPasswordChange()
      }
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
.el-dropdown-link[aria-expanded='true'] .dropdown-content {
  @apply bg-gray-50;
}
</style>
