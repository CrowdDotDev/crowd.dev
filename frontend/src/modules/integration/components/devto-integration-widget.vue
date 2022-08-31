<template>
  <el-dialog
    v-model:visible="isVisible"
    class="devto-integration-modal"
    append-to-body
    @close="cancel"
  >
    <template #title>
      <div class="flex flex-row">
        <img
          :src="logoUrl"
          class="w-10 h-10 mr-4"
          alt="DEV logo"
        />
        <div class="pt-1">
          <span
            class="block text-gray-800 text-xs font-normal leading-none"
            >Integration</span
          >
          <span class="block text-lg font-medium">DEV</span>
        </div>
      </div>
    </template>
    <el-form class="form devto-integration-widget">
      <div class="flex flex-col">
        <span class="text-sm font-medium"
          >Track organization articles</span
        >
        <span class="text-sm font-light mb-2 text-gray-600">
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
          <div class="flex flex-row items-center">
            <el-input
              v-model="org.username"
              class="text-green-500"
              spellcheck="false"
              placeholder="Enter organization slug"
            >
              <template #prepend>dev.to/</template>
              <template v-if="org.validating" #suffix>
                <i class="el-input__icon el-icon-loading" />
              </template>
            </el-input>
            <i
              v-if="!isLastOrganization"
              class="cursor-pointer ml-3 ri-delete-bin-line text-gray-700 text-2xl hover:text-gray-400"
              @click="removeOrganization(org.id)"
            />
          </div>
        </el-form-item>
        <a
          class="cursor-pointer text-sm font-medium text-primary-900"
          @click="addNewOrganization"
          >+ Add organization link</a
        >
        <span class="text-sm font-medium mt-6"
          >Track user articles</span
        >
        <span class="text-sm font-light mb-2 text-gray-600">
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
          <div class="flex flex-row items-center">
            <el-input
              v-model="user.username"
              spellcheck="false"
              placeholder="Enter user slug"
            >
              <template #prepend>dev.to/</template>
              <template v-if="user.validating" #suffix>
                <i class="el-input__icon el-icon-loading" />
              </template>
            </el-input>
            <i
              v-if="!isLastUser"
              class="cursor-pointer ml-3 ri-delete-bin-line text-gray-700 text-2xl hover:text-gray-400"
              @click="removeUser(user.id)"
            />
          </div>
        </el-form-item>
        <a
          class="cursor-pointer text-sm font-medium text-primary-900"
          @click="addNewUser"
          >+ Add user link</a
        >
      </div>
    </el-form>
    <template #footer>
      <div>
        <el-button
          class="btn btn--primary mr-2"
          :disabled="connectDisabled"
          @click="save"
        >
          <app-i18n code="common.connect"></app-i18n>
        </el-button>
        <el-button
          class="btn btn--secondary"
          @click="cancel"
        >
          <app-i18n code="common.cancel"></app-i18n>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import { mapActions } from 'vuex'
import integrationsJsonArray from '@/jsons/integrations.json'
import { IntegrationService } from '@/modules/integration/integration-service'

export default {
  name: 'DevtoIntegrationWidget',

  props: {
    integration: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      isVisible: false,
      logoUrl: integrationsJsonArray.find(
        (i) => i.platform === 'devto'
      ).image,
      users: [],
      organizations: []
    }
  },
  computed: {
    connectDisabled() {
      const validUsers = this.users.filter(
        (u) => !!u.username
      )
      const validOrgs = this.organizations.filter(
        (o) => !!o.username
      )

      const empty =
        validUsers.length + validOrgs.length === 0

      if (this.integration && !empty) {
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

      const relevantOrganizations = this.organizations.filter(
        (o) => !!o.username
      )
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

      if (this.integration) {
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
          const result = await IntegrationService.devtoValidateUser(
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
          const result = await IntegrationService.devtoValidateOrganization(
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
      const relevantOrganizations = this.organizations.filter(
        (o) => !!o.username
      )
      const relevantUsers = this.users.filter(
        (u) => !!u.username
      )

      const promises = [
        ...relevantOrganizations.map((o) =>
          this.handleOrganizationValidation(o.id)
        ),
        ...relevantUsers.map((u) =>
          this.handleUserValidation(u.id)
        )
      ]

      if (promises.length > 0) {
        await Promise.all(promises)
      }

      if (this.isValid) {
        await this.doDevtoConnect({
          users: relevantUsers.map((u) => u.username),
          organizations: relevantOrganizations.map(
            (o) => o.username
          )
        })

        this.isVisible = false
      }
    }
  }
}
</script>
<style lang="scss">
.devto-integration-widget {
  .el-form-item {
    @apply mb-2;
  }

  .el-input-group__prepend {
    @apply px-3;
  }
}
</style>
