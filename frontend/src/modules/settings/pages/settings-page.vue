<template>
  <app-page-wrapper>
    <div class="settings">
      <h4>
        Settings
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
import { mapGetters } from 'vuex';
import AppApiKeysPage from '@/modules/settings/pages/api-keys-page.vue';
import UserListPage from '@/modules/user/pages/user-list-page.vue';
import { UserPermissions } from '@/modules/user/user-permissions';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppAutomationListPage from '@/modules/automation/pages/automation-list-page.vue';

export default {
  name: 'AppSettingsPage',

  components: {
    AppApiKeysPage,
    'app-user-list-page': UserListPage,
    AppAutomationListPage,
  },

  data() {
    return {
      activeTab: null,
    };
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
    }),
    hasUsersModule() {
      return new UserPermissions(
        this.currentTenant,
        this.currentUser,
      ).read;
    },
    computedActiveTab: {
      get() {
        return this.activeTab;
      },
      set(value) {
        this.$router.push({
          name: 'settings',
          query: { activeTab: value },
        });
      },
    },
  },

  watch: {
    '$route.query.activeTab': {
      handler(newActiveTab) {
        if (newActiveTab) {
          this.activeTab = newActiveTab;
        }
      },
    },
  },

  created() {
    const lsSegmentsStore = useLfSegmentsStore();
    const { updateSelectedProjectGroup } = lsSegmentsStore;

    updateSelectedProjectGroup(null);
    const urlSearchParams = new URLSearchParams(
      window.location.search,
    );
    const params = Object.fromEntries(
      urlSearchParams.entries(),
    );

    this.activeTab = this.hasUsersModule
      ? params.activeTab || 'users'
      : params.activeTab;
  },
};
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
