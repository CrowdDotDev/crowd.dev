<template>
  <div>
    <el-dropdown
      trigger="click"
      placement="bottom-end"
      @command="handleCommand"
    >
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
            class="text-base mr-2 !text-red-500"
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
    <el-dialog
      v-model="editing"
      :close-on-click-modal="false"
      :show-close="false"
      :append-to-body="true"
      :destroy-on-close="true"
      custom-class="el-dialog--lg user-invite-dialog"
      @close="editing = false"
    >
      <template #header="{ close, titleId, titleClass }">
        <div
          class="flex grow justify-between"
          :class="{
            'items-center':
              user.status === 'invited' || !user.fullName
          }"
        >
          <div>
            <div
              v-if="user.fullName"
              class="text-2xs text-gray-600"
            >
              {{ user.fullName }}
            </div>
            <h5 :id="titleId" :class="titleClass">
              {{
                user.status === 'invited'
                  ? 'Edit invite'
                  : 'Edit User'
              }}
            </h5>
          </div>
          <el-button
            class="btn btn--transparent btn--xs w-8 !h-8"
            @click="close"
          >
            <i
              class="ri-close-line text-lg text-gray-400"
            ></i>
          </el-button>
        </div>
      </template>
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
