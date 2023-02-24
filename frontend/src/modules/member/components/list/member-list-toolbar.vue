<template>
  <div
    v-if="selectedRows.length > 0"
    class="app-list-table-bulk-actions"
  >
    <span class="block text-sm font-semibold mr-4">
      {{ pluralize('member', selectedRows.length, true) }}
      selected</span
    >
    <el-dropdown trigger="click" @command="handleCommand">
      <button class="btn btn--bordered btn--sm">
        <span class="mr-2">Actions</span>
        <i class="ri-xl ri-arrow-down-s-line"></i>
      </button>
      <template #dropdown>
        <el-dropdown-item :command="{ action: 'export' }">
          <i class="ri-lg ri-file-download-line mr-1" />
          Export to CSV
        </el-dropdown-item>
        <el-dropdown-item
          v-if="selectedRows.length === 2"
          :command="{ action: 'mergeMembers' }"
        >
          <i class="ri-lg ri-group-line mr-1" />
          Merge members
        </el-dropdown-item>
        <el-tooltip
          v-if="areSelectedMembersNotEnriched"
          placement="top"
          content="Selected members lack an associated GitHub profile or Email"
          :disabled="elegibleEnrichmentMembersIds.length"
          popper-class="max-w-[260px]"
        >
          <span>
            <el-dropdown-item
              :command="{ action: 'enrichMember' }"
              :disabled="
                !elegibleEnrichmentMembersIds.length
              "
              class="mb-1"
            >
              <app-svg
                name="enrichment"
                class="max-w-[16px] h-4"
                color="#9CA3AF"
              />
              <span class="ml-2">Enrich members</span>
            </el-dropdown-item>
          </span>
        </el-tooltip>
        <el-dropdown-item
          :command="{
            action: 'markAsTeamMember',
            value: markAsTeamMemberOptions.value
          }"
          :disabled="isReadOnly"
        >
          <i
            class="ri-lg mr-1"
            :class="markAsTeamMemberOptions.icon"
          />
          {{ markAsTeamMemberOptions.copy }}
        </el-dropdown-item>
        <el-dropdown-item :command="{ action: 'editTags' }">
          <i class="ri-lg ri-price-tag-3-line mr-1" />
          Edit tags
        </el-dropdown-item>
        <hr class="border-gray-200 my-1 mx-2" />
        <el-dropdown-item
          :command="{ action: 'destroyAll' }"
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
import ConfirmDialog from '@/shared/dialog/confirm-dialog.js'
import pluralize from 'pluralize'
import AppSvg from '@/shared/svg/svg.vue'
import { MemberService } from '@/modules/member/member-service'
import Message from '@/shared/message/message'

export default {
  name: 'AppMemberListToolbar',

  components: {
    AppMemberListBulkUpdateTags,
    AppSvg
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
      selectedRows: 'member/selectedRows',
      activeView: 'member/activeView'
    }),
    isReadOnly() {
      return (
        new MemberPermissions(
          this.currentTenant,
          this.currentUser
        ).edit === false
      )
    },
    elegibleEnrichmentMembersIds() {
      return this.selectedRows
        .filter(
          (r) =>
            (r.username?.github || r.email) &&
            !r.lastEnriched
        )
        .map((item) => item.id)
    },
    selectedIds() {
      return this.selectedRows
        .filter((item) => !item.lastEnriched)
        .map((item) => item.id)
    },
    areSelectedMembersNotEnriched() {
      return this.selectedRows.some(
        (item) => !item.lastEnriched
      )
    },
    markAsTeamMemberOptions() {
      const isTeamView = this.activeView.id === 'team'
      const membersCopy = pluralize(
        'member',
        this.selectedRows.length,
        false
      )

      if (isTeamView) {
        return {
          icon: 'ri-bookmark-2-line',
          copy: `Unmark as team ${membersCopy}`,
          value: false
        }
      }

      return {
        icon: 'ri-bookmark-line',
        copy: `Mark as team ${membersCopy}`,
        value: true
      }
    }
  },

  methods: {
    ...mapActions({
      doExport: 'member/doExport',
      doMarkAsTeamMember: 'member/doMarkAsTeamMember',
      doDestroyAll: 'member/doDestroyAll',
      doBulkEnrich: 'member/doBulkEnrich',
      doFetch: 'member/doFetch'
    }),

    async handleCommand(command) {
      if (command.action === 'markAsTeamMember') {
        await this.doMarkAsTeamMember(command.value)
      } else if (command.action === 'export') {
        await this.handleDoExport()
      } else if (command.action === 'mergeMembers') {
        await this.handleMergeMembers()
      } else if (command.action === 'editTags') {
        await this.handleAddTags()
      } else if (command.action === 'destroyAll') {
        await this.doDestroyAllWithConfirm()
      } else if (command.action === 'enrichMember') {
        // All members are elegible for enrichment
        if (
          this.elegibleEnrichmentMembersIds.length ===
          this.selectedIds.length
        ) {
          await this.doBulkEnrich(
            this.elegibleEnrichmentMembersIds
          )
        } else {
          // Only a few members are elegible for enrichment
          try {
            await ConfirmDialog({
              type: 'warning',
              title:
                'Some members lack an associated GitHub profile or Email',
              message:
                'Member enrichment requires an associated GitHub profile or Email. If you proceed, only the members who fulfill this requirement will be enriched and counted towards your quota.',
              confirmButtonText: `Proceed with enrichment (${pluralize(
                'member',
                this.elegibleEnrichmentMembersIds.length,
                true
              )})`,
              cancelButtonText: 'Cancel',
              icon: 'ri-alert-line'
            })

            await this.doBulkEnrich(
              this.elegibleEnrichmentMembersIds
            )
          } catch (error) {
            // no
          }
        }
      }
    },

    async handleMergeMembers() {
      const [firstMember, secondMember] = this.selectedRows
      await MemberService.merge(firstMember, secondMember)

      Message.success('Members merged successfuly')
      await this.doFetch({
        keepPagination: true
      })
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
        await this.doExport({ selected: true })
      } catch (error) {
        console.log(error)
      }
    },

    async handleAddTags() {
      this.bulkTagsUpdateVisible = true
    },

    pluralize
  }
}
</script>
