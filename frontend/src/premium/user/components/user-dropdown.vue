<template>
  <div>
    <el-dropdown trigger="click" @command="handleCommand">
      <span
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200"
        @click.stop
      >
        <i
          class="text-lg leading-none text-gray-600 ri-more-fill"
        ></i>
      </span>
      <template #dropdown>
        <el-dropdown-item
          v-if="user.status === 'invited'"
          command="userInviteTokenClipboard"
          ><i class="ri-link mr-1" />Copy Invite
          Link</el-dropdown-item
        >
        <el-dropdown-item command="userEdit">
          <i class="ri-pencil-line mr-1" />{{
            user.status === 'invited'
              ? 'Edit Invite'
              : 'Edit User'
          }}</el-dropdown-item
        >
        <el-dropdown-item command="userDelete"
          ><i class="ri-delete-bin-line mr-1" />{{
            user.status === 'invited'
              ? 'Delete Invite'
              : 'Delete User'
          }}</el-dropdown-item
        >
      </template>
    </el-dropdown>
    <el-dialog
      v-model="editing"
      :close-on-click-modal="false"
      title="Edit User"
      :append-to-body="true"
      :destroy-on-close="true"
      custom-class="el-dialog--lg"
      @close="editing = false"
    >
      <app-user-form-page
        :id="user.id"
        @cancel="editing = false"
      >
      </app-user-form-page>
    </el-dialog>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { i18n } from '@/i18n'
import UserEditPage from './user-edit-page'
import config from '@/config'
import Message from '@/shared/message/message'

export default {
  name: 'AppUserDropdown',
  components: {
    'app-user-form-page': UserEditPage
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
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        await this.doDestroy(this.user.id)
        this.$emit('user-destroyed', this.user.id)
      } catch (error) {
        // no
      }
    }
  }
}
</script>
