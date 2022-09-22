<template>
  <el-dropdown
    trigger="click"
    @command="handleDropdownCommand"
  >
    <div class="el-dropdown-link">
      <div
        class="flex items-center"
        :class="collapsed ? 'px-3 py-4' : 'p-4'"
      >
        <app-avatar
          :entity="computedAvatarEntity"
          size="sm"
          class="mr-2"
        ></app-avatar>
        <div v-if="!collapsed" class="text-sm">
          <div class="text-white font-semibold">
            {{ currentUserNameOrEmailPrefix }}
          </div>
          <div class="text-white opacity-75">
            {{ currentTenant.name }}
          </div>
        </div>
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

  props: {
    collapsed: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    ...mapGetters({
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
