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
        <span class="el-dropdown-title">Workspace</span>
        <div class="flex items-center text-sm px-5 mb-1">
          <div
            class="h-2 w-2 flex justify-center items-center bg-primary-900 rounded-full mr-2"
          ></div>
          <div class="text-gray-600">
            {{ currentTenant.name }}
          </div>
        </div>
        <el-dropdown-item
          v-if="
            ['multi', 'multi-with-subdomain'].includes(
              tenantMode
            ) && hasTenantModule
          "
          command="doSwitchTenants"
        >
          Manage Workspaces
        </el-dropdown-item>
        <hr class="el-dropdown-separator" />
        <span class="el-dropdown-title">Account</span>
        <el-dropdown-item command="doEditProfile">
          <app-i18n code="auth.profile.title"></app-i18n>
        </el-dropdown-item>
        <el-dropdown-item command="doPasswordChange">
          <app-i18n
            code="auth.passwordChange.title"
          ></app-i18n>
        </el-dropdown-item>
      </div>
      <el-dropdown-item command="doSignout">
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
  name: 'AppMenuUserDropdown',

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
