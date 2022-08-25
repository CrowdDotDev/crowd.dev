<template>
  <div class="settings">
    <h1 class="app-content-title">
      <app-i18n code="settings.title"></app-i18n>
    </h1>
    <el-tabs v-model="activeTab" class="mt-8">
      <el-tab-pane
        label="Users & Permissions"
        name="users"
        labelClass="app-content-title"
        v-if="hasUsersModule"
      >
        <app-user-list-page class="pt-4" />
      </el-tab-pane>
      <el-tab-pane label="Integrations" name="integrations">
        <app-integrations-list-page />
      </el-tab-pane>
      <el-tab-pane label="API Keys" name="api-keys">
        <div class="panel mt-4">
          <div
            class="border p-4 mb-4 rounded-lg border-secondary-900 bg-secondary-50"
          >
            <div class="flex items-start">
              <i
                class="ri-information-fill mr-4 ri-xl flex items-center pt-1 text-secondary-900"
              ></i>
              <div class="text-sm">
                <div class="font-semibold mb-1">
                  API Access
                </div>
                <div>
                  To get the most out of our API
                  <a
                    href="https://app.swaggerhub.com/apis-docs/Crowd.dev/Crowd.dev"
                    target="_blank"
                    class="font-semibold"
                    >(read docs)</a
                  >, you will need
                  <ul class="list-disc ml-6 mt-2">
                    <li>
                      <span class="font-semibold"
                        >Tenant Id</span
                      >
                      — to identify the workspace
                    </li>
                    <li>
                      <span class="font-semibold"
                        >Auth Token</span
                      >
                      — to authenticate and authorize
                      requests
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <el-form class="form mt-4 flex -mx-3">
            <el-form-item
              label="TenantId"
              class="w-full lg:w-1/2 mx-3"
            >
              <el-input :value="tenantId" :readonly="true">
                <el-tooltip
                  content="Copy to Clipboard"
                  placement="top"
                  slot="append"
                >
                  <el-button
                    icon="ri-clipboard-line"
                    @click="copyToClipboard('tenantId')"
                  ></el-button>
                </el-tooltip>
              </el-input>
            </el-form-item>
            <el-form-item
              label="Auth Token"
              class="w-full lg:w-1/2 mx-3"
            >
              <el-input
                :value="showToken ? jwtToken : '(hidden)'"
                :disabled="!showToken"
                :readonly="showToken"
              >
                <el-tooltip
                  content="Show Auth Token"
                  placement="top"
                  slot="append"
                  v-if="!showToken"
                >
                  <el-button
                    icon="ri-eye-line"
                    @click="showToken = true"
                  ></el-button>
                </el-tooltip>
                <el-tooltip
                  content="Copy to Clipboard"
                  placement="top"
                  slot="append"
                  v-else
                >
                  <el-button
                    icon="ri-clipboard-line"
                    @click="copyToClipboard('token')"
                  ></el-button>
                </el-tooltip>
              </el-input>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import UserListPage from '@/premium/user/components/user-list-page'
import IntegrationListPage from '@/modules/integration/components/integration-list-page'
import { AuthToken } from '@/modules/auth/auth-token'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import Message from '@/shared/message/message'
import config from '@/config'
import { UserPermissions } from '@/premium/user/user-permissions'

export default {
  name: 'app-settings-page',

  components: {
    'app-user-list-page': UserListPage,
    'app-integrations-list-page': IntegrationListPage
  },

  computed: {
    jwtToken() {
      return AuthToken.get()
    },
    tenantId() {
      return AuthCurrentTenant.get()
    },
    hasUsersModule() {
      if (
        new UserPermissions(
          this.currentTenant,
          this.currentUser
        ).read
      ) {
        return true
      } else if (config.edition === 'crowd-hosted') {
        return true
      } else return config.communityPremium === 'true'
    }
  },

  data() {
    return {
      activeTab: null,
      showToken: false
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
      : 'integrations'
  },

  methods: {
    async copyToClipboard(type) {
      const toCopy =
        type === 'token' ? this.jwtToken : this.tenantId
      await navigator.clipboard.writeText(toCopy)
      Message.success(
        `${
          type === 'token' ? 'Auth Token' : 'TenantId'
        } successfully copied to your clipboard`
      )
    }
  }
}
</script>

<style lang="scss">
.settings {
  .el-tabs {
    &__header {
      @apply m-0 border-b;
    }
    &__active-bar {
      @apply bg-primary-900;
    }
    &__item {
      @apply font-semibold;
      &.is-active {
        @apply text-black;
      }
      &:focus.is-active.is-focus:not(:active) {
        box-shadow: none;
      }
    }
    &__content {
      @apply rounded border-0;
    }
  }
}
</style>
