<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    @command="$event()"
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
        :command="onDeleteConversation"
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

<script setup lang="ts">
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { computed } from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import Message from '@/shared/message/message';
import { i18n } from '@/i18n';
import { ConversationPermissions } from '../conversation-permissions';
import { ConversationService } from '../conversation-service';

const emit = defineEmits<{(e: 'conversation-destroyed'): void}>();
const props = defineProps<{
  conversation: {
    id: string
  },
}>();

const { currentTenant, currentUser } = mapGetters('auth');

const isDeleteLockedForSampleData = computed(() => new ConversationPermissions(
  currentTenant.value,
  currentUser.value,
).destroyLockedForSampleData);

const onDeleteConversation = async () => {
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

    await ConversationService.destroyAll([props.conversation.id]);

    Message.success(i18n('entities.conversation.destroy.success'));

    emit('conversation-destroyed');
  } catch (error) {
    // no
  }

  return null;
};
</script>
