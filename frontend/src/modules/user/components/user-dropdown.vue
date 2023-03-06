<template>
  <div>
    <el-dropdown
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
          v-if="user.status === 'invited'"
          command="userInviteTokenClipboard"
          ><i class="ri-file-copy-line mr-2" /><span
            class="text-xs"
            >Copy invite link</span
          ></el-dropdown-item
        >
        <el-dropdown-item command="userEdit">
          <i class="ri-pencil-line mr-2" /><span
            class="text-xs"
            >{{
              user.status === 'invited'
                ? 'Edit invite'
                : 'Edit user'
            }}</span
          ></el-dropdown-item
        >
        <el-divider class="border-gray-200 my-2" />
        <el-dropdown-item command="userDelete"
          ><i
            class="text-base mr-2 text-red-500"
            :class="
              user.status === 'invited'
                ? 'ri-close-circle-line'
                : 'ri-delete-bin-line'
            "
          /><span class="text-xs text-red-500">{{
            user.status === 'invited'
              ? 'Cancel invite'
              : 'Delete user'
          }}</span></el-dropdown-item
        >
      </template>
    </el-dropdown>
    <app-dialog
      v-model="editing"
      custom-class="user-invite-dialog"
      :pre-title="user.fullName ?? null"
      :title="
        user.status === 'invited'
          ? 'Edit invite'
          : 'Edit User'
      "
    >
      <template #content>
        <app-user-form-page
          :id="user.id"
          @cancel="editing = false"
        >
        </app-user-form-page>
      </template>
    </app-dialog>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import AppUserEditPage from '@/modules/user/pages/user-edit-page'
import config from '@/config'
import Message from '@/shared/message/message'
import ConfirmDialog from '@/shared/dialog/confirm-dialog.js'

export default {
  name: 'AppUserDropdown',
  components: {
    'app-user-form-page': AppUserEditPage
  },
  props: {
    user: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['user-destroyed'],
  data() {
    return {
      editing: false
    }
  },
  computed: {
    computedInviteLink() {
      return `${config.frontendUrl.protocol}://${config.frontendUrl.host}/auth/invitation?token=${this.user.invitationToken}`
    }
  },
  methods: {
    ...mapActions({
      doDestroy: 'user/destroy/doDestroy'
    }),
    handleCommand(command) {
      if (command === 'userDelete') {
        return this.doDestroyWithConfirm()
      } else if (command === 'userEdit') {
        this.editing = true
      } else if (command === 'userInviteTokenClipboard') {
        this.copyToClipboard()
      } else {
        return this.$router.push({
          name: command,
          params: { id: this.user.id }
        })
      }
    },
    async copyToClipboard() {
      await navigator.clipboard.writeText(
        this.computedInviteLink
      )
      Message.success(
        `Invite link successfully copied to your clipboard`
      )
    },
    async doDestroyWithConfirm() {
      try {
        await ConfirmDialog({
          type:
            this.user.status === 'invited'
              ? 'info'
              : 'danger',
          title:
            this.user.status === 'invited'
              ? 'Cancel invite'
              : 'Delete user',
          message:
            "Are you sure you want to proceed? You can't undo this action",
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          icon:
            this.user.status === 'invited'
              ? 'ri-close-circle-line'
              : 'ri-delete-bin-line'
        })

        await this.doDestroy(this.user.id)
        this.$emit('user-destroyed', this.user.id)
      } catch (error) {
        // no
      }
    }
  }
}
</script>
