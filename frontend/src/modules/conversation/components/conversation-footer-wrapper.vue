<template>
  <slot
    name="footer"
    v-bind="{
      sourceId,
      attributes,
      isGithubConversation,
      isGitConversation,
      replyContent,
    }"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  conversation: {
    type: Object,
    required: true,
  },
});

const attributes = computed(() => props.conversation.conversationStarter.attributes);
const sourceId = computed(() => props.conversation.conversationStarter.sourceId);
const isGithubConversation = computed(() => props.conversation.platform === 'github');
const isGitConversation = computed(() => props.conversation.platform === 'git');
const replyContent = computed(() => {
  if (isGitConversation.value) {
    return null;
  }

  if (isGithubConversation.value) {
    const activities = props.conversation.lastReplies || props.conversation.activities;
    return {
      icon: 'ri-chat-4-line',
      copy: 'comment',
      number: activities.reduce((acc, activity) => {
        if (activity.type.includes('comment')) {
          return acc + 1;
        }

        return acc;
      }, 0),
    };
  }

  return {
    icon: 'ri-reply-line',
    copy: 'reply',
    number: props.conversation.activityCount - 1,
  };
});
</script>

<script>
export default {
  name: 'AppConversationParentFooter',
};
</script>
