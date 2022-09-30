<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly"
      trigger="click"
      placement="bottom-end"
      @command="handleCommand"
    >
      <span
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200"
        @click="handleClick"
      >
        <i
          class="text-lg leading-none text-gray-600 ri-more-fill"
        ></i>
      </span>
      <template #dropdown>
        <el-dropdown-item
          class="h-10"
          :command="{
            action: 'communityMemberEdit',
            communityMember: member
          }"
          ><i class="ri-pencil-line text-base mr-2" /><span
            class="text-xs text-gray-900"
            >Edit member</span
          ></el-dropdown-item
        >
        <el-dropdown-item
          class="h-10"
          :command="{
            action: 'communityMemberMerge',
            communityMember: member
          }"
          ><i class="ri-group-line text-base mr-2" /><span
            class="text-xs text-gray-900"
            >Merge member</span
          ></el-dropdown-item
        >
        <el-dropdown-item
          v-if="!member.team"
          class="h-10"
          :command="{
            action: 'communityMemberMarkAsTeamMember',
            communityMember: member
          }"
          ><i
            class="ri-bookmark-line text-base mr-2"
          /><span class="text-xs text-gray-900"
            >Mark as team member</span
          ></el-dropdown-item
        >
        <el-divider class="border-gray-200" />
        <el-dropdown-item
          class="h-10"
          :command="{
            action: 'communityMemberDelete',
            communityMember: member
          }"
          ><i
            class="ri-delete-bin-line text-base mr-2 text-red-500"
          /><span class="text-xs text-red-500"
            >Delete member</span
          >
        </el-dropdown-item>
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
import { mapActions, mapGetters, mapState } from 'vuex'
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
    ...mapState({
      rawFilter: (state) => state.communityMember.rawFilter
    }),
    ...mapGetters({
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
      doFetch: 'communityMember/doFetch',
      doFind: 'communityMember/doFind',
      doDestroy: 'communityMember/doDestroy'
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
            attributes: {
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
    },
    handleClick(event) {
      event.stopPropagation()
    }
  }
}
</script>

<style lang="scss">
.el-dropdown__popper .el-dropdown__list {
  @apply p-2;
}

// Override divider margin
.el-divider--horizontal {
  @apply my-2;
}
</style>
