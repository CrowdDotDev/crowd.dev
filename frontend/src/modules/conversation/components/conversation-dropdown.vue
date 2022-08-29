<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <span class="el-dropdown-link">
      <i class="text-xl ri-more-line"></i>
    </span>
    <el-dropdown-menu>
      <el-dropdown-item
        v-if="conversation.published"
        icon="ri-link"
        :command="{
          action: 'conversationPublicUrl',
          conversation: conversation
        }"
        >Copy Public Url</el-dropdown-item
      >
      <el-dropdown-item
        v-if="showViewConversation"
        icon="ri-eye-line"
        :command="{
          action: 'conversationView',
          conversation: conversation
        }"
        >View Conversation</el-dropdown-item
      >
      <el-dropdown-item
        v-if="!conversation.published"
        icon="ri-upload-cloud-2-line"
        :command="{
          action: 'conversationPublish',
          conversation: conversation
        }"
        >Publish Conversation</el-dropdown-item
      >
      <el-dropdown-item
        v-else
        icon="ri-arrow-go-back-line"
        :command="{
          action: 'conversationUnpublish',
          conversation: conversation
        }"
        >Unpublish Conversation</el-dropdown-item
      >
      <el-dropdown-item
        icon="ri-delete-bin-line"
        :command="{
          action: 'conversationDelete',
          conversation: conversation
        }"
        >Delete Conversation</el-dropdown-item
      >
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
import { i18n } from '@/i18n'
import { mapGetters, mapActions } from 'vuex'
import Message from '@/shared/message/message'
import config from '@/config'

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
    }
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant'
    })
  },
  methods: {
    ...mapActions({
      doDestroy: 'conversation/doDestroy',
      doPublish: 'conversation/doPublish',
      doUnpublish: 'conversation/doUnpublish'
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
        this.editing = false
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
      } else {
        return this.$router.push({
          name: command.action,
          params: { id: command.conversation.id }
        })
      }
    }
  }
}
</script>
