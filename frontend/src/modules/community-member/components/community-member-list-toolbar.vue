<template>
  <div
    v-if="selectedRows.length > 0"
    class="app-page-toolbar community-member-list-toolbar"
  >
    <span class="block text-sm font-semibold mr-4"
      >{{ selectedRows.length }}
      {{ selectedRows.length > 1 ? 'rows' : 'row' }}
      selected</span
    >
    <el-button
      :disabled="markAsTeamMemberButtonDisabled"
      class="btn btn--secondary mr-2"
      @click="doMarkAsTeamMember()"
    >
      <i class="ri-lg ri-user-follow-line mr-1" />
      Mark as Team Member
    </el-button>

    <el-button
      :disabled="exportButtonDisabled"
      class="btn btn--secondary mr-2"
      @click="doExport()"
    >
      <i class="ri-lg ri-file-text-line mr-1" />
      Export to CSV
    </el-button>

    <app-community-member-list-bulk-update-tags
      :loading="loading"
      :selected-rows="selectedRows"
    />

    <el-button
      :disabled="destroyButtonDisabled"
      class="btn btn--secondary mr-2"
      @click="doDestroyAllWithConfirm"
    >
      <i class="ri-lg ri-delete-bin-line mr-1" />
      <app-i18n code="common.destroy"></app-i18n>
    </el-button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AppCommunityMemberListBulkUpdateTags from '@/modules/community-member/components/community-member-list-bulk-update-tags'
import { i18n } from '@/i18n'

export default {
  name: 'AppCommunityMemberListToolbar',

  components: {
    AppCommunityMemberListBulkUpdateTags
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      hasRows: 'communityMember/list/hasRows',
      loading: 'communityMember/list/loading',
      exportLoading: 'communityMember/list/exportLoading',
      selectedRows: 'communityMember/list/selectedRows',
      destroyLoading: 'communityMember/destroy/loading'
    }),

    exportButtonDisabled() {
      return (
        !this.hasRows || this.loading || this.exportLoading
      )
    },

    markAsTeamMemberButtonDisabled() {
      return !this.hasRows || this.loading
    },

    destroyButtonDisabled() {
      return (
        !this.selectedRows.length ||
        this.loading ||
        this.destroyLoading
      )
    }
  },

  methods: {
    ...mapActions({
      doExport: 'communityMember/list/doExport',
      doMarkAsTeamMember:
        'communityMember/list/doMarkAsTeamMember',
      doRemoveAllSelected:
        'communityMember/list/doRemoveAllSelected',
      doDisableAllSelected:
        'communityMember/list/doDisableAllSelected',
      doEnableAllSelected:
        'communityMember/list/doEnableAllSelected',
      doDestroyAll: 'communityMember/destroy/doDestroyAll',
      doBulkUpdateMembersTags:
        'communityMember/list/doBulkUpdateMembersTags'
    }),

    async doDestroyAllWithConfirm() {
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        return this.doDestroyAll(
          this.selectedRows.map((item) => item.id)
        )
      } catch (error) {
        // no
      }
    }
  }
}
</script>

<style lang="scss">
.community-member-list-toolbar {
  @apply flex items-center justify-end absolute h-16 top-0 mt-1 right-0 z-10 bg-white rounded-tr-xl p-2;
  width: calc(100% - 75px);
}
</style>
