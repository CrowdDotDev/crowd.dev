<template>
  <div
    v-if="selectedRows.length > 0"
    class="app-list-table-bulk-actions"
  >
    <span class="block text-sm font-semibold mr-4"
      >{{ selectedRows.length }}
      {{ selectedRows.length > 1 ? 'members' : 'member' }}
      selected</span
    >
    <el-dropdown trigger="click" @command="handleCommand">
      <button class="btn btn--bordered btn--sm">
        <span class="mr-2">Actions</span>
        <i class="ri-xl ri-arrow-down-s-line"></i>
      </button>
      <template #dropdown>
        <el-dropdown-item command="export">
          <i class="ri-lg ri-file-download-line mr-1" />
          Export to CSV
        </el-dropdown-item>
        <el-dropdown-item
          command="markAsTeamMember"
          :disabled="isReadOnly"
        >
          <i class="ri-lg ri-bookmark-line mr-1" />
          Mark as team member{{
            selectedRows.length === 1 ? '' : 's'
          }}
        </el-dropdown-item>
        <el-dropdown-item command="editTags">
          <i class="ri-lg ri-price-tag-3-line mr-1" />
          Edit tags
        </el-dropdown-item>
        <hr class="border-gray-200 my-1 mx-2" />
        <el-dropdown-item
          command="destroyAll"
          :disabled="isReadOnly"
        >
          <div class="text-red-500 flex items-center">
            <i class="ri-lg ri-delete-bin-line mr-2" />
            <app-i18n code="common.destroy"></app-i18n>
          </div>
        </el-dropdown-item>
      </template>
    </el-dropdown>

    <app-member-list-bulk-update-tags
      v-model="bulkTagsUpdateVisible"
      :loading="loading"
      :selected-rows="selectedRows"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'
import AppMemberListBulkUpdateTags from '@/modules/member/components/list/member-list-bulk-update-tags'
import { MemberPermissions } from '@/modules/member/member-permissions'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'

export default {
  name: 'AppMemberListToolbar',

  components: {
    AppMemberListBulkUpdateTags
  },

  data() {
    return {
      bulkTagsUpdateVisible: false
    }
  },

  computed: {
    ...mapState({
      loading: (state) => state.member.list.loading
    }),
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      hasRows: 'member/hasRows',
      selectedRows: 'member/selectedRows'
    }),
    isReadOnly() {
      return (
        new MemberPermissions(
          this.currentTenant,
          this.currentUser
        ).edit === false
      )
    }
  },

  methods: {
    ...mapActions({
      doExport: 'member/doExport',
      doMarkAsTeamMember: 'member/doMarkAsTeamMember',
      doRemoveAllSelected: 'member/doRemoveAllSelected',
      doDisableAllSelected: 'member/doDisableAllSelected',
      doEnableAllSelected: 'member/doEnableAllSelected',
      doDestroyAll: 'member/doDestroyAll',
      doBulkUpdateMembersTags:
        'member/doBulkUpdateMembersTags'
    }),

    async handleCommand(command) {
      if (command === 'markAsTeamMember') {
        await this.doMarkAsTeamMember()
      } else if (command === 'export') {
        await this.handleDoExport()
      } else if (command === 'editTags') {
        await this.handleAddTags()
      } else if (command === 'destroyAll') {
        await this.doDestroyAllWithConfirm()
      }
    },

    async doDestroyAllWithConfirm() {
      try {
        await ConfirmDialog({
          type: 'danger',
          title: 'Delete members',
          message:
            "Are you sure you want to proceed? You can't undo this action",
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          icon: 'ri-delete-bin-line'
        })

        await this.doDestroyAll(
          this.selectedRows.map((item) => item.id)
        )
      } catch (error) {
        console.log(error)
      }
    },

    async handleDoExport() {
      try {
        await this.doExport()
      } catch (error) {
        console.log(error)
      }
    },

    async handleAddTags() {
      this.bulkTagsUpdateVisible = true
    }
  }
}
</script>
