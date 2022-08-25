<template>
  <div>
    <el-dropdown trigger="click" @command="handleCommand">
      <span class="el-dropdown-link">
        <i class="ri-xl ri-more-line"></i>
      </span>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item
          icon="ri-link"
          command="userInviteTokenClipboard"
          v-if="user.status === 'invited'"
          >Copy Invite Link</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-pencil-line"
          command="userEdit"
          >{{
            user.status === 'invited'
              ? 'Edit Invite'
              : 'Edit User'
          }}</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-delete-bin-line"
          command="userDelete"
          >{{
            user.status === 'invited'
              ? 'Delete Invite'
              : 'Delete User'
          }}</el-dropdown-item
        >
      </el-dropdown-menu>
    </el-dropdown>
    <el-dialog
      :visible.sync="editing"
      title="Edit User"
      :append-to-body="true"
      :destroy-on-close="true"
      @close="editing = false"
      custom-class="el-dialog--lg"
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
  name: 'app-user-dropdown',
  props: {
    user: {
      type: Object,
      default: () => {}
    }
  },
  components: {
    'app-user-form-page': UserEditPage
  },
  computed: {
    computedInviteLink() {
      return `${config.frontendUrl.protocol}://${config.frontendUrl.host}/auth/invitation?token=${this.user.invitationToken}`
    }
  },
  data() {
    return {
      editing: false
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
