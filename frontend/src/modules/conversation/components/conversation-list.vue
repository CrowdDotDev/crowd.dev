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
        @details="conversationId = conversation.id"
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
  <app-conversation-drawer
    :expand="conversationId != null"
    :conversation-id="conversationId"
    @close="conversationId = null"
  ></app-conversation-drawer>
</template>

<script>
import AppConversationItem from '@/modules/conversation/components/conversation-item'
import AppConversationDrawer from '@/modules/conversation/components/conversation-drawer'
export default {
  name: 'AppConversationsList',
  components: {
    AppConversationDrawer,
    AppConversationItem
  },
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
  },
  data() {
    return {
      conversationId: null
    }
  }
}
</script>
