<template>
  <el-dropdown
    v-if="hasPermission(LfPermission.conversationEdit)"
    trigger="click"
    placement="bottom-end"
    @command="$event()"
  >
    <button
      class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-400"
      type="button"
      @click.stop
    >
      <lf-icon name="ellipsis" type="solid" :size="20" />
    </button>
    <template #dropdown>
      <el-dropdown-item
        :command="onDeleteConversation"
      >
        <lf-icon name="trash-can" class="text-red-500 mr-1" :size="16" />
        <span
          class="text-red-500"
        >Delete conversation</span>
      </el-dropdown-item>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import Message from '@/shared/message/message';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { ConversationService } from '../conversation-service';

const emit = defineEmits<{(e: 'conversation-destroyed'): void}>();
const props = defineProps<{
  conversation: {
    id: string
    platform: string;
  },
}>();

const { trackEvent } = useProductTracking();

const { hasPermission } = usePermissions();

const onDeleteConversation = async () => {
  try {
    await ConfirmDialog({
      type: 'danger',
      title: 'Delete conversation',
      message:
            "Are you sure you want to proceed? You can't undo this action",
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      icon: 'fa-trash-can fa-light',
    });

    trackEvent({
      key: FeatureEventKey.DELETE_CONVERSATION,
      type: EventType.FEATURE,
      properties: {
        conversationPlatform: props.conversation.platform,
      },
    });

    await ConversationService.destroyAll([props.conversation.id]);

    Message.success('Conversation successfully deleted');

    emit('conversation-destroyed');
  } catch (error) {
    // no
  }

  return null;
};
</script>
