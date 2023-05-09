<template>
  <slot
    name="footer"
    v-bind="{
      attributes,
      isGithubConversation,
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

const attributes = computed(() => props.conversation.conversationStarter?.attributes);
const isGithubConversation = computed(() => props.conversation.platform === 'github');
const replyContent = computed(() => {
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
