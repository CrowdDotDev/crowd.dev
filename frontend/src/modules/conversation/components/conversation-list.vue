<template>
  <div>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    ></div>
    <div v-else>
      <app-conversation-item
        v-for="conversation of conversations"
        :key="conversation.id"
        :conversation="conversation"
      />
      <div v-if="conversations.length === 0">
        <div class="flex justify-center pt-16">
          <i
            class="ri-question-answer-line text-4xl h-12 text-gray-300"
          ></i>
        </div>
        <p
          class="text-xs leading-5 text-center italic text-gray-400 pt-4 pb-12"
        >
          There are no conversations
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import AppConversationItem from '@/modules/conversation/components/conversation-item'
export default {
  name: 'AppConversationsList',
  components: { AppConversationItem },
  props: {
    conversations: {
      type: Array,
      default: () => {}
    },
    loading: {
      type: Boolean,
      default: false
    },
    itemsAsCards: {
      type: Boolean,
      default: false
    }
  }
}
</script>
