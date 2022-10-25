<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly"
      trigger="click"
      placement="bottom-end"
      @command="handleCommand"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.stop
      >
        <i class="text-xl ri-more-fill"></i>
      </button>
      <template #dropdown>
        <el-dropdown-item
          :command="{
            action: 'memberEdit',
            member
          }"
          class="h-10"
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
  </div>
</template>

<script>
import { i18n } from '@/i18n'
import { mapActions, mapGetters } from 'vuex'
import { MemberService } from '@/modules/member/member-service'
import Message from '@/shared/message/message'
import { MemberPermissions } from '@/modules/member/member-permissions'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'

export default {
  name: 'AppMemberDropdown',
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
        await ConfirmDialog({
          title: i18n('common.confirm'),
          message: i18n('common.areYouSure'),
          confirmButtonText: i18n('common.yes'),
          cancelButtonText: i18n('common.no')
        })

        return this.doDestroy(id)
      } catch (error) {
        // no
      }
    },
    async handleCommand(command) {
      if (command.action === 'memberDelete') {
        return this.doDestroyWithConfirm(command.member.id)
      } else if (command.action === 'memberEdit') {
        this.$router.push({
          name: 'memberEdit',
          params: {
            id: command.member.id
          }
        })
      } else if (
        command.action === 'memberMarkAsTeamMember'
      ) {
        await MemberService.update(command.member.id, {
          attributes: {
            ...command.member.attributes,
            isTeamMember: {
              crowd: true,
              default: true
            }
          }
        })
        Message.success('Member updated successfully')
        if (this.$route.name === 'member') {
          this.doFetch({
            filter: {},
            keepPagination: true
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
