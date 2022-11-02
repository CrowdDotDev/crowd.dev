<template>
  <app-page-wrapper>
    <div class="settings">
      <h4>
        <app-i18n code="settings.title"></app-i18n>
      </h4>
      <el-tabs v-model="computedActiveTab" class="mt-10">
        <el-tab-pane
          v-if="hasUsersModule"
          label="Users & Permissions"
          name="users"
          label-class="app-content-title"
        >
          <app-user-list-page
            v-if="activeTab === 'users'"
            class="pt-4"
          />
        </el-tab-pane>
        <el-tab-pane label="Automations" name="automations">
          <app-automation-list-page
            v-if="activeTab === 'automations'"
          />
        </el-tab-pane>
        <el-tab-pane label="API Keys" name="api-keys">
          <app-api-keys-page
            v-if="activeTab === 'api-keys'"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </app-page-wrapper>
</template>

<script>
import AppPageWrapper from '@/modules/layout/components/page-wrapper'
import AppApiKeysPage from '@/modules/settings/pages/api-keys-page'
import UserListPage from '@/premium/user/pages/user-list-page'
import AutomationListPage from '@/modules/automation/pages/automation-list-page'
import config from '@/config'
import { UserPermissions } from '@/premium/user/user-permissions'

export default {
  name: 'AppSettingsPage',

  components: {
    AppPageWrapper,
    AppApiKeysPage,
    'app-user-list-page': UserListPage,
    'app-automation-list-page': AutomationListPage
  },

  data() {
    return {
      activeTab: null
    }
  },

  computed: {
    hasUsersModule() {
      return (
        config.hasPremiumModules &&
        new UserPermissions(
          this.currentTenant,
          this.currentUser
        ).read
      )
    },
    computedActiveTab: {
      get() {
        return this.activeTab
      },
      set(value) {
        this.$router.push({
          name: 'settings',
          query: { activeTab: value }
        })
      }
    }
  },

  watch: {
    '$route.query.activeTab'(newActiveTab) {
      if (newActiveTab) {
        this.activeTab = newActiveTab
      }
    }
  },

  created() {
    const urlSearchParams = new URLSearchParams(
      window.location.search
    )
    const params = Object.fromEntries(
      urlSearchParams.entries()
    )

    this.activeTab = this.hasUsersModule
      ? params['activeTab'] || 'users'
      : 'api-keys'
  }
}
</script>

<style lang="scss">
.el-tabs {
  &__item {
    @apply font-normal text-black;
    &.is-active {
      @apply text-black;
    }
  }
}
</style>
