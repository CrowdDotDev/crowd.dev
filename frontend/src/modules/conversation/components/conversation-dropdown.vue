<template>
  <el-dropdown
    v-if="conversation.published || hasPermissionsToEditConversation || hasPermissionsToDeleteConversation"
    trigger="click"
    placement="bottom-end"
    @command="handleCommand"
  >
    <button
      class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
      type="button"
      @click.stop
    >
      <i class="text-xl ri-more-fill" />
    </button>
    <template #dropdown>
      <el-dropdown-item
        v-if="conversation.published"
        :command="{
          action: 'conversationPublicUrl',
          conversation: conversation,
        }"
      >
        <i class="ri-link mr-1" />Copy Public
        Url
      </el-dropdown-item>
      <template v-if="publishEnabled">
        <el-dropdown-item
          v-if="!conversation.published && hasPermissionsToEditConversation"
          :command="{
            action: 'conversationPublish',
            conversation: conversation,
          }"
          :disabled="isEditLockedForSampleData"
        >
          <i class="ri-upload-cloud-2-line mr-1" />Publish
          conversation
        </el-dropdown-item>
        <el-dropdown-item
          v-else-if="hasPermissionsToEditConversation"
          :command="{
            action: 'conversationUnpublish',
            conversation: conversation,
          }"
          :disabled="isEditLockedForSampleData"
        >
          <i class="ri-arrow-go-back-line mr-1" />Unpublish
          conversation
        </el-dropdown-item>
      </template>

      <el-dropdown-item
        v-if="hasPermissionsToDeleteConversation"
        :command="{
          action: 'conversationDelete',
          conversation: conversation,
        }"
        :disabled="isDeleteLockedForSampleData"
      >
        <i
          class="ri-delete-bin-line mr-1"
          :class="{
            'text-red-500': !isDeleteLockedForSampleData,
          }"
        /><span
          :class="{
            'text-red-500': !isDeleteLockedForSampleData,
          }"
        >Delete conversation</span>
      </el-dropdown-item>
    </template>
  </el-dropdown>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import Message from '@/shared/message/message';
import config from '@/config';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { ConversationPermissions } from '../conversation-permissions';

export default {
  name: 'AppConversationDropdown',
  props: {
    conversation: {
      type: Object,
      default: () => {},
    },
    showViewConversation: {
      type: Boolean,
      default: true,
    },
    publishEnabled: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data() {
    return {
      dropdownVisible: false,
    };
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser',
      communityHelpCenterConfigured:
        'communityHelpCenter/isConfigured',
    }),
    hasPermissionsToEditConversation() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser,
      ).edit;
    },
    hasPermissionsToDeleteConversation() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser,
      ).destroy;
    },
    isEditLockedForSampleData() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser,
      ).editLockedForSampleData;
    },
    isDeleteLockedForSampleData() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser,
      ).destroyLockedForSampleData;
    },
  },
  methods: {
    ...mapActions({
      doDestroy: 'communityHelpCenter/doDestroy',
      doPublish: 'communityHelpCenter/doPublish',
      doUnpublish: 'communityHelpCenter/doUnpublish',
      doOpenSettingsDrawer:
        'communityHelpCenter/doOpenSettingsDrawer',
    }),
    async doDestroyWithConfirm(id) {
      try {
        await ConfirmDialog({
          type: 'danger',
          title: 'Delete conversation',
          message:
            "Are you sure you want to proceed? You can't undo this action",
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          icon: 'ri-delete-bin-line',
        });

        return this.doDestroy(id);
      } catch (error) {
        // no
      }
      return null;
    },
    async handleCommand(command) {
      if (command.action === 'conversationDelete') {
        return this.doDestroyWithConfirm(
          command.conversation.id,
        );
      } if (
        command.action === 'conversationPublicUrl'
      ) {
        const url = `${config.conversationPublicUrl}/${this.currentTenant.url}/${command.conversation.slug}`;

        await navigator.clipboard.writeText(url);

        Message.success(
          'Conversation Public URL successfully copied to your clipboard',
        );
      } else if (command.action === 'conversationPublish') {
        if (!this.communityHelpCenterConfigured) {
          return this.doOpenSettingsDrawer();
        }
        await this.doPublish({
          id: command.conversation.id,
        });
      } else if (
        command.action === 'conversationUnpublish'
      ) {
        this.editing = false;
        await this.doUnpublish({
          id: command.conversation.id,
        });
      }
      return null;
    },
  },
};
</script>
