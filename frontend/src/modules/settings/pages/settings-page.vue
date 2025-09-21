<template>
  <app-page-wrapper>
    <div class="settings">
      <h4>
        Manage workspace
      </h4>
      <el-tabs v-model="computedActiveTab" class="mt-10">
        <el-tab-pane label="API Keys" name="api-keys">
          <app-api-keys-page
            v-if="activeTab === 'api-keys'"
          />
        </el-tab-pane>
        <el-tab-pane label="Invitations" name="invitations">
          <app-invitations-page
            v-if="activeTab === 'invitations'"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </app-page-wrapper>
</template>

<script>
import AppApiKeysPage from '@/modules/settings/pages/api-keys-page.vue';
import AppInvitationsPage from '@/modules/settings/pages/invitations-page.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

export default {
  name: 'AppSettingsPage',

  components: {
    AppApiKeysPage,
    AppInvitationsPage,
  },

  data() {
    return {
      activeTab: null,
    };
  },

  computed: {
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

    this.activeTab = params.activeTab || 'api-keys';
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
