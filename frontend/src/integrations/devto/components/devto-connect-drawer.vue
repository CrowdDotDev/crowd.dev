<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-devto-drawer"
    title="DEV"
    pre-title="Integration"
    has-border
    @close="cancel"
  >
    <template #beforeTitle>
      <img
        class="w-6 h-6 mr-2"
        :src="logoUrl"
        alt="DEV logo"
      />
    </template>
    <template #content>
      <el-form class="form integration-devto-form">
        <div class="flex flex-col gap-2 items-start">
          <span class="text-sm font-medium">Track config articles</span>
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            Monitor all articles from config accounts
          </span>
          <el-form-item
            v-for="org in organizations"
            :key="org.id"
            class="mb-4 w-full"
            :class="{
              'is-error': org.touched && !org.valid,
              'is-success': org.touched && org.valid,
            }"
          >
            <div
              class="flex flex-row items-center w-full gap-4"
            >
              <el-input
                id="devOrganization"
                v-model="org.username"
                class="text-green-500"
                spellcheck="false"
                placeholder="Enter config slug"
                @blur="handleOrganizationValidation(org.id)"
              >
                <template #prepend>
                  dev.to/
                </template>
                <template #suffix>
                  <div
                    v-if="org.validating"
                    v-loading="org.validating"
                    class="flex items-center justify-center w-6 h-6"
                  />
                </template>
              </el-input>
              <el-button
                v-if="!isLastOrganization"
                class="btn btn--md btn--transparent w-10 h-10"
                @click="removeOrganization(org.id)"
              >
                <i
                  class="ri-delete-bin-line text-lg text-black"
                />
              </el-button>
            </div>
            <span
              v-if="org.touched && !org.valid"
              class="el-form-item__error"
            >Organization slug is not valid</span>
          </el-form-item>
          <el-button
            class="btn btn-link btn-link--primary"
            @click="addNewOrganization"
          >
            + Add config link
          </el-button>
          <span class="text-sm font-medium mt-8">Track user articles</span>
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            Monitor articles from individual users, such as
            team contacts or community advocates
          </span>
          <el-form-item
            v-for="user in users"
            :key="user.id"
            class="mb-4 w-full"
            :class="{
              'is-error': user.touched && !user.valid,
              'is-success': user.touched && user.valid,
            }"
          >
            <div
              class="flex flex-row items-center w-full gap-4"
            >
              <el-input
                id="devUser"
                v-model="user.username"
                spellcheck="false"
                placeholder="Enter user slug"
                @blur="handleUserValidation(user.id)"
              >
                <template #prepend>
                  dev.to/
                </template>
                <template #suffix>
                  <div
                    v-if="user.validating"
                    v-loading="user.validating"
                    class="flex items-center justify-center w-6 h-6"
                  />
                </template>
              </el-input>
              <el-button
                v-if="!isLastUser"
                class="btn btn--md btn--transparent w-10 h-10"
                @click="removeUser(user.id)"
              >
                <i
                  class="ri-delete-bin-line text-lg text-black"
                />
              </el-button>
            </div>
            <span
              v-if="user.touched && !user.valid"
              class="el-form-item__error"
            >User slug is not valid</span>
          </el-form-item>
          <el-button
            class="btn btn-link btn-link--primary"
            @click="addNewUser"
          >
            + Add user link
          </el-button>
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
          <app-i18n code="common.cancel" />
        </el-button>
        <el-button
          id="devConnect"
          class="btn btn--md btn--primary"
          :disabled="connectDisabled || loading"
          :loading="loading"
          @click="save"
        >
          <app-i18n code="common.connect" />
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script>
import { mapActions } from 'vuex';
import { IntegrationService } from '@/modules/integration/integration-service';
import { CrowdIntegrations } from '@/integrations/integrations-config';

export default {
  name: 'AppDevtoConnectDrawer',

  props: {
    integration: {
      type: Object,
      default: null,
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      logoUrl: CrowdIntegrations.getConfig('devto').image,
      users: [],
      organizations: [],
      loading: false,
    };
  },
  computed: {
    isVisible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
    connectDisabled() {
      if (!this.isValid) {
        return true;
      }

      const validUsers = this.users.filter(
        (u) => !!u.username,
      );
      const validOrgs = this.organizations.filter(
        (o) => !!o.username,
      );

      const empty = validUsers.length + validOrgs.length === 0;

      if (this.integration.settings && !empty) {
        return (
          validUsers.length
            === this.integration.settings.users.length
          && validUsers.every((u) => this.integration.settings.users.includes(
            u.username,
          ))
          && validOrgs.length
            === this.integration.settings.organizations
              .length
          && validOrgs.every((o) => this.integration.settings.organizations.includes(
            o.username,
          ))
        );
      }

      return empty;
    },
    isLastOrganization() {
      return this.organizations.length === 1;
    },
    isLastUser() {
      return this.users.length === 1;
    },
    isValid() {
      const relevantUsers = this.users.filter(
        (u) => !!u.username,
      );

      if (relevantUsers.some((user) => !user.valid)) {
        return false;
      }

      const relevantOrganizations = this.organizations.filter((o) => !!o.username);
      if (relevantOrganizations.some((org) => !org.valid)) {
        return false;
      }

      return (
        relevantUsers.length
          + relevantOrganizations.length
        > 0
      );
    },
    maxId() {
      if (
        this.users.length === 0
        && this.organizations.length === 0
      ) return 0;

      let maxId = -1;
      this.users.forEach((user) => {
        if (user.id > maxId) {
          maxId = user.id;
        }
      });

      this.organizations.forEach((org) => {
        if (org.id > maxId) {
          maxId = org.id;
        }
      });

      return maxId;
    },
  },
  watch: {
    integration: {
      handler(newVal) {
        if (newVal) {
          this.syncData();
        }
      },
    },
  },

  mounted() {
    this.syncData();
  },

  methods: {
    ...mapActions({
      doDevtoConnect: 'integration/doDevtoConnect',
    }),

    toggle() {
      this.isVisible = !this.isVisible;
    },

    syncData() {
      this.users = [];
      this.organizations = [];

      if (this.integration && this.integration.settings) {
        this.integration.settings.users.forEach((u) => this.addNewUser(u));
        this.integration.settings.organizations.forEach(
          (o) => this.addNewOrganization(o),
        );
      }

      if (this.users.length === 0) {
        this.addNewUser();
      }
      if (this.organizations.length === 0) {
        this.addNewOrganization();
      }
    },

    addNewUser(username) {
      this.users.push({
        id: this.maxId + 1,
        username:
          typeof username === 'string'
          || username instanceof String
            ? username
            : '',
        touched: false,
        valid: false,
        validating: false,
      });
    },

    removeUser(id) {
      this.users = this.users.filter((u) => u.id !== id);
    },

    addNewOrganization(username) {
      this.organizations.push({
        id: this.maxId + 1,
        username:
          typeof username === 'string'
          || username instanceof String
            ? username
            : '',
        touched: false,
        valid: false,
        validating: false,
      });
    },

    removeOrganization(id) {
      this.organizations = this.organizations.filter(
        (o) => o.id !== id,
      );
    },

    async handleUserValidation(id) {
      const user = this.users.find((u) => u.id === id);

      try {
        user.validating = true;

        if (!user.username) {
          user.valid = false;
          return;
        }

        if (
          this.users.find(
            (u) => u.id !== id && u.username === user.username,
          )
        ) {
          user.valid = false;
        } else {
          const result = await IntegrationService.devtoValidateUser(
            user.username,
          );

          user.valid = !!result;
        }
      } catch (e) {
        console.error(e);
        user.valid = false;
      } finally {
        user.validating = false;
        user.touched = true;
      }
    },

    async handleOrganizationValidation(id) {
      const organization = this.organizations.find(
        (o) => o.id === id,
      );

      try {
        organization.validating = true;

        if (!organization.username) {
          organization.valid = false;
          return;
        }

        if (
          this.organizations.find(
            (o) => o.id !== id
              && o.username === organization.username,
          )
        ) {
          organization.valid = false;
        } else {
          const result = await IntegrationService.devtoValidateOrganization(
            organization.username,
          );
          organization.valid = !!result;
        }
      } catch (e) {
        console.error(e);
        organization.valid = false;
      } finally {
        organization.validating = false;
        organization.touched = true;
      }
    },

    cancel() {
      this.isVisible = false;
      this.syncData();
    },

    async save() {
      this.loading = true;

      const relevantOrganizations = this.organizations.filter((o) => !!o.username);
      const relevantUsers = this.users.filter(
        (u) => !!u.username,
      );
      await this.doDevtoConnect({
        users: relevantUsers.map((u) => u.username),
        organizations: relevantOrganizations.map(
          (o) => o.username,
        ),
      });

      this.isVisible = false;
      this.loading = false;
    },
  },
};
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
