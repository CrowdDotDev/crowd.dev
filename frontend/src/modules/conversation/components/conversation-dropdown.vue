<template>
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
        v-if="conversation.published"
        :command="{
          action: 'conversationPublicUrl',
          conversation: conversation
        }"
        ><i class="ri-link mr-1" />Copy Public
        Url</el-dropdown-item
      >
      <template v-if="publishEnabled">
        <el-dropdown-item
          v-if="!conversation.published"
          :command="{
            action: 'conversationPublish',
            conversation: conversation
          }"
          ><i class="ri-upload-cloud-2-line mr-1" />Publish
          Conversation</el-dropdown-item
        >
        <el-dropdown-item
          v-else
          :command="{
            action: 'conversationUnpublish',
            conversation: conversation
          }"
          ><i class="ri-arrow-go-back-line mr-1" />Unpublish
          Conversation</el-dropdown-item
        >
      </template>

      <el-dropdown-item
        :command="{
          action: 'conversationDelete',
          conversation: conversation
        }"
        ><i class="ri-delete-bin-line mr-1 text-red" /><span
          class="text-red"
          >Delete Conversation</span
        ></el-dropdown-item
      >
    </template>
  </el-dropdown>
</template>

<script>
import { i18n } from '@/i18n'
import { mapGetters, mapActions } from 'vuex'
import Message from '@/shared/message/message'
import config from '@/config'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'

export default {
  name: 'AppConversationDropdown',
  props: {
    conversation: {
      type: Object,
      default: () => {}
    },
    showViewConversation: {
      type: Boolean,
      default: true
    },
    publishEnabled: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  data() {
    return {
      dropdownVisible: false
    }
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      communityHelpCenterConfigured:
        'communityHelpCenter/isConfigured'
    })
  },
  methods: {
    ...mapActions({
      doDestroy: 'communityHelpCenter/doDestroy',
      doPublish: 'communityHelpCenter/doPublish',
      doUnpublish: 'communityHelpCenter/doUnpublish',
      doOpenSettingsDrawer:
        'communityHelpCenter/doOpenSettingsDrawer'
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
      if (command.action === 'conversationDelete') {
        return this.doDestroyWithConfirm(
          command.conversation.id
        )
      } else if (
        command.action === 'conversationPublicUrl'
      ) {
        const url = `${config.conversationPublicUrl}/${this.currentTenant.url}-c/${this.record.slug}`
        await navigator.clipboard.writeText(url)
        Message.success(
          'Conversation Public URL successfully copied to your clipboard'
        )
      } else if (command.action === 'conversationPublish') {
        if (!this.communityHelpCenterConfigured) {
          return this.doOpenSettingsDrawer()
        }
        await this.doPublish({
          id: command.conversation.id
        })
      } else if (
        command.action === 'conversationUnpublish'
      ) {
        this.editing = false
        await this.doUnpublish({
          id: command.conversation.id
        })
      }
    }
  }
}
</script>
