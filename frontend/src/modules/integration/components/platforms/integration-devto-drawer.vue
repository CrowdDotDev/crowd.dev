<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-devto-drawer"
    title="DEV"
    pre-title="Integration"
    :pre-title-img-src="logoUrl"
    pre-title-img-alt="DEV logo"
    @close="cancel"
  >
    <template #content>
      <el-form class="form integration-devto-form">
        <div class="flex flex-col">
          <span class="text-sm font-medium"
            >Track organization articles</span
          >
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            Monitor all articles from organization accounts
          </span>
          <el-form-item
            v-for="org in organizations"
            :key="org.id"
            :class="{
              'is-error': org.touched && !org.valid,
              'is-success': org.touched && org.valid
            }"
          >
            <div class="flex flex-row items-center w-full">
              <el-input
                id="devOrganization"
                v-model="org.username"
                class="text-green-500"
                spellcheck="false"
                placeholder="Enter organization slug"
                @blur="handleOrganizationValidation(org.id)"
              >
                <template #prepend>dev.to/</template>
                <template #suffix>
                  <div
                    v-if="org.validating"
                    v-loading="org.validating"
                    class="flex items-center justify-center w-6 h-6"
                  ></div>
                </template>
              </el-input>
              <i
                v-if="!isLastOrganization"
                class="cursor-pointer ml-4 ri-delete-bin-line text-gray-600 text-base hover:text-gray-900"
                @click="removeOrganization(org.id)"
              />
            </div>
            <span
              v-if="org.touched && !org.valid"
              class="el-form-item__error"
              >Organization slug is not valid</span
            >
          </el-form-item>
          <a
            class="cursor-pointer text-sm font-medium text-brand-500"
            @click="addNewOrganization"
            >+ Add organization link</a
          >
          <span class="text-sm font-medium mt-8"
            >Track user articles</span
          >
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            Monitor articles from individual users, such as
            team members or community advocates
          </span>
          <el-form-item
            v-for="user in users"
            :key="user.id"
            :class="{
              'is-error': user.touched && !user.valid,
              'is-success': user.touched && user.valid
            }"
          >
            <div class="flex flex-row items-center w-full">
              <el-input
                id="devUser"
                v-model="user.username"
                spellcheck="false"
                placeholder="Enter user slug"
                @blur="handleUserValidation(user.id)"
              >
                <template #prepend>dev.to/</template>
                <template #suffix>
                  <div
                    v-if="user.validating"
                    v-loading="user.validating"
                    class="flex items-center justify-center w-6 h-6"
                  ></div>
                </template>
              </el-input>
              <i
                v-if="!isLastUser"
                class="cursor-pointer ml-4 ri-delete-bin-line text-gray-600 text-base hover:text-gray-900"
                @click="removeUser(user.id)"
              />
            </div>
            <span
              v-if="user.touched && !user.valid"
              class="el-form-item__error"
              >User slug is not valid</span
            >
          </el-form-item>
          <a
            class="cursor-pointer text-sm font-medium text-brand-500"
            @click="addNewUser"
            >+ Add user link</a
          >
        </div>
      </el-form>
    </template>
    <template #footer>
      <div>
        <el-button
          class="btn btn--md btn--bordered mr-4"
          :disabled="loading"
          @click="cancel"
        >
          <app-i18n code="common.cancel"></app-i18n>
        </el-button>
        <el-button
          id="devConnect"
          class="btn btn--md btn--primary"
          :disabled="connectDisabled || loading"
          :loading="loading"
          @click="save"
        >
          <app-i18n code="common.connect"></app-i18n>
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script>
import { mapActions } from 'vuex'
import integrationsJsonArray from '@/jsons/integrations.json'
import { IntegrationService } from '@/modules/integration/integration-service'

export default {
  name: 'IntegrationDevtoDrawer',

  props: {
    integration: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      logoUrl: integrationsJsonArray.find(
        (i) => i.platform === 'devto'
      ).image,
      users: [],
      organizations: [],
      loading: false
    }
  },
  computed: {
    isVisible: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    connectDisabled() {
      if (!this.isValid) {
        return true
      }

      const validUsers = this.users.filter(
        (u) => !!u.username
      )
      const validOrgs = this.organizations.filter(
        (o) => !!o.username
      )

      const empty =
        validUsers.length + validOrgs.length === 0

      if (this.integration.settings && !empty) {
        return (
          validUsers.length ===
            this.integration.settings.users.length &&
          validUsers.every((u) =>
            this.integration.settings.users.includes(
              u.username
            )
          ) &&
          validOrgs.length ===
            this.integration.settings.organizations
              .length &&
          validOrgs.every((o) =>
            this.integration.settings.organizations.includes(
              o.username
            )
          )
        )
      }

      return empty
    },
    isLastOrganization() {
      return this.organizations.length === 1
    },
    isLastUser() {
      return this.users.length === 1
    },
    isValid() {
      const relevantUsers = this.users.filter(
        (u) => !!u.username
      )
      for (const user of relevantUsers) {
        if (!user.valid) return false
      }

      const relevantOrganizations =
        this.organizations.filter((o) => !!o.username)
      for (const org of relevantOrganizations) {
        if (!org.valid) return false
      }

      return (
        relevantUsers.length +
          relevantOrganizations.length >
        0
      )
    },
    maxId() {
      if (
        this.users.length === 0 &&
        this.organizations.length === 0
      )
        return 0

      let maxId = -1
      for (const user of this.users) {
        if (user.id > maxId) {
          maxId = user.id
        }
      }

      for (const org of this.organizations) {
        if (org.id > maxId) {
          maxId = org.id
        }
      }

      return maxId
    }
  },
  watch: {
    integration: {
      handler: function (newVal) {
        if (newVal) {
          this.syncData()
        }
      }
    }
  },

  mounted() {
    this.syncData()
  },

  methods: {
    ...mapActions({
      doDevtoConnect: 'integration/doDevtoConnect'
    }),

    toggle() {
      this.isVisible = !this.isVisible
    },

    syncData() {
      this.users = []
      this.organizations = []

      if (this.integration && this.integration.settings) {
        this.integration.settings.users.forEach((u) =>
          this.addNewUser(u)
        )
        this.integration.settings.organizations.forEach(
          (o) => this.addNewOrganization(o)
        )
      }

      if (this.users.length === 0) {
        this.addNewUser()
      }
      if (this.organizations.length === 0) {
        this.addNewOrganization()
      }
    },

    addNewUser(username) {
      this.users.push({
        id: this.maxId + 1,
        username:
          typeof username === 'string' ||
          username instanceof String
            ? username
            : '',
        touched: false,
        valid: false,
        validating: false
      })
    },

    removeUser(id) {
      this.users = this.users.filter((u) => u.id !== id)
    },

    addNewOrganization(username) {
      this.organizations.push({
        id: this.maxId + 1,
        username:
          typeof username === 'string' ||
          username instanceof String
            ? username
            : '',
        touched: false,
        valid: false,
        validating: false
      })
    },

    removeOrganization(id) {
      this.organizations = this.organizations.filter(
        (o) => o.id !== id
      )
    },

    async handleUserValidation(id) {
      const user = this.users.find((u) => u.id === id)

      try {
        user.validating = true

        if (!user.username) {
          user.valid = false
          return
        }

        if (
          this.users.find(
            (u) =>
              u.id !== id && u.username === user.username
          )
        ) {
          user.valid = false
        } else {
          const result =
            await IntegrationService.devtoValidateUser(
              user.username
            )

          user.valid = !!result
        }
      } catch (e) {
        console.error(e)
        user.valid = false
      } finally {
        user.validating = false
        user.touched = true
      }
    },

    async handleOrganizationValidation(id) {
      const organization = this.organizations.find(
        (o) => o.id === id
      )

      try {
        organization.validating = true

        if (!organization.username) {
          organization.valid = false
          return
        }

        if (
          this.organizations.find(
            (o) =>
              o.id !== id &&
              o.username === organization.username
          )
        ) {
          organization.valid = false
        } else {
          const result =
            await IntegrationService.devtoValidateOrganization(
              organization.username
            )
          organization.valid = !!result
        }
      } catch (e) {
        console.error(e)
        organization.valid = false
      } finally {
        organization.validating = false
        organization.touched = true
      }
    },

    cancel() {
      this.isVisible = false
      this.syncData()
    },

    async save() {
      this.loading = true

      const relevantOrganizations =
        this.organizations.filter((o) => !!o.username)
      const relevantUsers = this.users.filter(
        (u) => !!u.username
      )
      await this.doDevtoConnect({
        users: relevantUsers.map((u) => u.username),
        organizations: relevantOrganizations.map(
          (o) => o.username
        )
      })

      this.isVisible = false
      this.loading = false
    }
  }
}
</script>
<style lang="scss">
.integration-devto-form {
  .el-form-item {
    @apply mb-3;
    &__content {
      @apply mb-0;
    }
  }

  .el-input-group__prepend {
    @apply px-3;
  }
}
</style>
