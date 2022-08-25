<template>
  <div>
    <el-dropdown
      trigger="click"
      @command="handleCommand"
      v-if="!isReadOnly"
    >
      <span class="el-dropdown-link">
        <i class="text-xl ri-more-line"></i>
      </span>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item
          icon="ri-eye-line"
          :command="{
            action: 'communityMemberView',
            communityMember: member
          }"
          v-if="showViewMember"
          >View Member</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-pencil-line"
          :command="{
            action: 'communityMemberEdit',
            communityMember: member
          }"
          >Edit Member</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-group-line"
          :command="{
            action: 'communityMemberMerge',
            communityMember: member
          }"
          >Merge With Another Member</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-user-follow-line"
          :command="{
            action: 'communityMemberMarkAsTeamMember',
            communityMember: member
          }"
          v-if="!member.crowdInfo.team"
          >Mark as Team Member</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-delete-bin-line"
          :command="{
            action: 'communityMemberDelete',
            communityMember: member
          }"
          >Delete Member</el-dropdown-item
        >
      </el-dropdown-menu>
    </el-dropdown>

    <el-dialog
      :visible.sync="editing"
      title="Edit Member"
      :append-to-body="true"
      :destroy-on-close="true"
      @close="editing = false"
      custom-class="el-dialog--lg"
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
  name: 'app-community-member-dropdown',
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
