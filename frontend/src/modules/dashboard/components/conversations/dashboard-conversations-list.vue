<template>
  <div v-if="conversations">
    <app-dashboard-conversations-item
      v-for="(conversation, ci) of conversations"
      :key="conversation.id"
      :class="{ 'border-b': ci < conversations.length - 1 }"
      :conversation="conversation"
    />
    <div v-if="conversations.length === 0">
      <p class="text-xs leading-5 text-center pt-4">
        No trending conversations
      </p>
    </div>
    <div class="pt-3 pb-2 flex justify-center">
      <router-link
        :to="{ name: 'conversation' }"
        class="text-red font-medium text-center text-xs leading-5"
      >
        All conversations
      </router-link>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppDashboardConversationsItem from '@/modules/dashboard/components/conversations/dashboard-conversations-item'
export default {
  name: 'AppDashboardConversationsList',
  components: { AppDashboardConversationsItem },
  emits: { count: null },
  computed: {
    ...mapGetters('dashboard', {
      conversations: 'trendingConversations'
    })
  }
}
</script>
