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
            action: 'memberEdit',
            member: member
          }"
          ><i class="ri-pencil-line text-base mr-2" /><span
            class="text-xs text-gray-900"
            >Edit member</span
          ></el-dropdown-item
        >
        <el-dropdown-item
          class="h-10"
          :command="{
            action: 'memberMerge',
            member: member
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
            action: 'memberMarkAsTeamMember',
            member: member
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
            action: 'memberDelete',
            member: member
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
      <app-member-form-page
        :id="member.id"
        @cancel="editing = false"
      >
      </app-member-form-page>
    </el-dialog>
  </div>
</template>

<script>
import { i18n } from '@/i18n'
import { mapActions, mapGetters } from 'vuex'
import AppMemberFormPage from './member-form-page'
import { MemberService } from '@/modules/member/member-service'
import Message from '@/shared/message/message'
import { MemberPermissions } from '@/modules/member/member-permissions'

export default {
  name: 'AppMemberDropdown',
  components: { AppMemberFormPage },
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
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser'
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
      doFetch: 'member/doFetch',
      doFind: 'member/doFind',
      doDestroy: 'member/doDestroy'
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
      if (command.action === 'memberDelete') {
        return this.doDestroyWithConfirm(command.member.id)
      } else if (command.action === 'memberEdit') {
        this.editing = true
      } else if (
        command.action === 'memberMarkAsTeamMember'
      ) {
        await MemberService.update(command.member.id, {
          attributes: {
            team: true
          }
        })
        Message.success('Member updated successfully')
        if (this.$route.name === 'member') {
          this.doFetch({
            filter: {}
          })
        } else {
          this.doFind(command.member.id)
        }
      } else {
        return this.$router.push({
          name: command.action,
          params: { id: command.member.id }
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
