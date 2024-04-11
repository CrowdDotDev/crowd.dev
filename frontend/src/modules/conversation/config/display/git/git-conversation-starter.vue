<template>
  <lf-git-activity-header-content
    :activity="conversation.conversationStarter"
  />
  <div class="pt-8">
    <app-activity-content
      :class="
        conversation.conversationStarter.title
          ? 'text-sm'
          : 'text-base'
      "
      title-classes="text-base font-medium"
      :activity="conversation.conversationStarter"
      :show-more="true"
    />
    <div class="flex items-center py-6">
      <div class="flex-grow border-b border-gray-200" />
      <div
        v-if="conversation.activityCount > 3"
        class="text-xs h-6 flex items-center px-3 rounded-3xl border border-gray-200 text-gray-500"
      >
        {{ separatorContent }}
      </div>
      <div class="flex-grow border-b border-gray-200" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import pluralize from 'pluralize';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import { Conversation } from '@/shared/modules/conversation/types/Conversation';
import LfGitActivityHeaderContent from '@/modules/activity/config/display/git/git-activity-header-content.vue';

const props = defineProps<{
  conversation: Conversation;
}>();

const separatorContent = computed(() => pluralize('more activities', props.conversation.activityCount - 3, true));
</script>
@/shared/modules/conversation/types/Conversation
