<template>
  <div
    class="flex items-start justify-between gap-2 border-b border-gray-200 px-6 py-7"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <i class="ri-code-commit text-lg text-gray-400" />
        <span class="text-sm text-gray-900">SHA: {{ conversation.conversationStarter.sourceId }}</span>
      </div>
      <div class="flex items-center gap-3">
        <lf-git-attributes
          :activity="conversation.conversationStarter"
          :in-conversation="true"
        />
      </div>
      <div class="flex items-center gap-3">
        <i class="ri-group-3-line text-lg text-gray-400" />
        <span class="text-sm text-gray-900">
          {{ pluralize("participant", conversation.memberCount, true) }}
        </span>
      </div>
    </div>
    <div>
      <app-conversation-dropdown :conversation="conversation" />
    </div>
  </div>
</template>

<script setup lang="ts">
import pluralize from 'pluralize';
import { Conversation } from '@/shared/modules/conversation/types/Conversation';
import AppConversationDropdown from '@/modules/conversation/components/conversation-dropdown.vue';
import LfGitAttributes from '@/modules/activity/config/display/git/git-attributes.vue';

defineProps<{
  conversation: Conversation;
}>();
</script>
@/shared/modules/conversation/types/Conversation
