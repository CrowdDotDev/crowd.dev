<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly"
      trigger="click"
      @command="handleCommand"
    >
      <span class="el-dropdown-link">
        <i class="text-xl ri-more-line"></i>
      </span>
      <template #dropdown>
        <el-dropdown-item
          v-if="showViewMember"
          :command="{
            action: 'communityMemberView',
            communityMember: member
          }"
          ><i class="ri-eye-line mr-1" />View
          Member</el-dropdown-item
        >
        <el-dropdown-item
          :command="{
            action: 'communityMemberEdit',
            communityMember: member
          }"
          ><i class="ri-pencil-line mr-1" />Edit
          Member</el-dropdown-item
        >
        <el-dropdown-item
          :command="{
            action: 'communityMemberMerge',
            communityMember: member
          }"
          ><i class="ri-group-line mr-1" />Merge With
          Another Member</el-dropdown-item
        >
        <el-dropdown-item
          v-if="!member.crowdInfo.team"
          :command="{
            action: 'communityMemberMarkAsTeamMember',
            communityMember: member
          }"
          ><i class="ri-user-follow-line mr-1" />Mark as
          Team Member</el-dropdown-item
        >
        <el-dropdown-item
          :command="{
            action: 'communityMemberDelete',
            communityMember: member
          }"
          ><i class="ri-delete-bin-line mr-1" />Delete
          Member</el-dropdown-item
        >
      </template>
    </el-dropdown>

    <el-dialog
      v-if="editing"
      v-model="editing"
      title="Edit Member"
      :append-to-body="true"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      custom-class="el-dialog--lg"
      @close="editing = false"
    >
      <app-community-member-form-page
        :id="member.id"
        @cancel="editing = false"
      >
      </app-community-member-form-page>
    </el-dialog>
  </div>
</template>

<script>
import { i18n } from '@/i18n'
import { mapActions, mapGetters } from 'vuex'
import AppCommunityMemberFormPage from './community-member-form-page'
import { CommunityMemberService } from '@/modules/community-member/community-member-service'
import Message from '@/shared/message/message'
import { FilterSchema } from '@/shared/form/filter-schema'
import { CommunityMemberModel } from '@/modules/community-member/community-member-model'
import { CommunityMemberPermissions } from '@/modules/community-member/community-member-permissions'

const { fields } = CommunityMemberModel
const filterSchema = new FilterSchema([
  fields.username,
  fields.tags,
  fields.scoreRange,
  fields.activitiesCountRange,
  fields.reachRange
])

export default {
  name: 'AppCommunityMemberDropdown',
  components: { AppCommunityMemberFormPage },
  props: {
    member: {
      type: Object,
      default: () => {}
    },
    showViewMember: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      editing: false
    }
  },
  computed: {
    ...mapGetters({
      rawFilter: 'communityMember/list/rawFilter',
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser'
    }),
    isReadOnly() {
      return (
        new CommunityMemberPermissions(
          this.currentTenant,
          this.currentUser
        ).edit === false
      )
    }
  },
  methods: {
    ...mapActions({
      doFetch: 'communityMember/list/doFetch',
      doFind: 'communityMember/view/doFind',
      doDestroy: 'communityMember/destroy/doDestroy'
    }),
    async doDestroyWithConfirm(id) {
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

        return this.doDestroy(id)
      } catch (error) {
        // no
      }
    },
    async handleCommand(command) {
      if (command.action === 'communityMemberDelete') {
        return this.doDestroyWithConfirm(
          command.communityMember.id
        )
      } else if (command.action === 'communityMemberEdit') {
        this.editing = true
      } else if (
        command.action === 'communityMemberMarkAsTeamMember'
      ) {
        await CommunityMemberService.update(
          command.communityMember.id,
          {
            crowdInfo: {
              ...command.communityMember.crowdInfo,
              team: true
            }
          }
        )
        Message.success('Member updated successfully')
        if (this.$route.name === 'communityMember') {
          this.doFetch({
            rawFilter: this.rawFilter,
            filter: filterSchema.cast(this.rawFilter)
          })
        } else {
          this.doFind(command.communityMember.id)
        }
      } else {
        return this.$router.push({
          name: command.action,
          params: { id: command.communityMember.id }
        })
      }
    }
  }
}
</script>
