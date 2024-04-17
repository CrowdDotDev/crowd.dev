<template>
  <article
    class="conversation-item panel"
    @click="emit('click')"
  >
    <component
      :is="configuration?.conversationStarter"
      :conversation="conversation"
    />
    <component
      :is="configuration?.conversationReplies"
      :conversation="conversation"
    />
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import config from '@/modules/conversation/config/display/main';
import { Conversation } from '../types/Conversation';

const emit = defineEmits<{(e: 'click'): void;}>();

defineProps<{
  conversation: Conversation;
}>();

const configuration = computed(() => config.git);
</script>
