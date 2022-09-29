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
      @click="handleDoExport"
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
import { mapGetters, mapActions, mapState } from 'vuex'
import AppCommunityMemberListBulkUpdateTags from '@/modules/community-member/components/community-member-list-bulk-update-tags'
import { i18n } from '@/i18n'

export default {
  name: 'AppCommunityMemberListToolbar',

  components: {
    AppCommunityMemberListBulkUpdateTags
  },

  data() {
    return {
      isExportLoading: false,
      isDestroyLoading: false
    }
  },

  computed: {
    ...mapState({
      loading: (state) => state.communityMember.list.loading
    }),
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      hasRows: 'communityMember/hasRows',
      selectedRows: 'communityMember/selectedRows'
    }),

    exportButtonDisabled() {
      return (
        !this.hasRows ||
        this.loading ||
        this.isExportLoading
      )
    },

    markAsTeamMemberButtonDisabled() {
      return !this.hasRows || this.loading
    },

    destroyButtonDisabled() {
      return (
        !this.selectedRows.length ||
        this.loading ||
        this.isDestroyLoading
      )
    }
  },

  methods: {
    ...mapActions({
      doExport: 'communityMember/doExport',
      doMarkAsTeamMember:
        'communityMember/doMarkAsTeamMember',
      doRemoveAllSelected:
        'communityMember/doRemoveAllSelected',
      doDisableAllSelected:
        'communityMember/doDisableAllSelected',
      doEnableAllSelected:
        'communityMember/doEnableAllSelected',
      doDestroyAll: 'communityMember/doDestroyAll',
      doBulkUpdateMembersTags:
        'communityMember/doBulkUpdateMembersTags'
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

        this.isDestroyLoading = true

        await this.doDestroyAll(
          this.selectedRows.map((item) => item.id)
        )

        this.isDestroyLoading = false
      } catch (error) {
        this.isDestroyLoading = false
        // no
      }
    },

    async handleDoExport() {
      try {
        this.isExportLoading = true

        await this.doExport()

        this.isExportLoading = false
      } catch (error) {
        this.isExportLoading = false
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
