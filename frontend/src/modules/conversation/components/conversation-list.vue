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
        :is-card="itemsAsCards"
      />
      <div v-if="conversations.length === 0">
        <p class="text-xs leading-5 text-center pt-4">
          No trending conversations during this period
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
