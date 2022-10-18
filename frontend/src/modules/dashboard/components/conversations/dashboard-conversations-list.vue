<template>
  <div>
    <div v-if="conversations.loading">
      <app-dashboard-conversations-item
        v-for="(el, ci) of new Array(3)"
        :key="el"
        :class="{
          'border-b': ci < trendingConversations.length - 1
        }"
        :loading="true"
      />
    </div>
    <div v-else>
      <app-dashboard-conversations-item
        v-for="(conversation, ci) of trendingConversations"
        :key="conversation.id"
        :class="{
          'border-b': ci < trendingConversations.length - 1
        }"
        :conversation="conversation"
      />
      <div v-if="trendingConversations.length === 0">
        <p class="text-xs leading-5 text-center pt-4">
          No trending conversations during this period
        </p>
      </div>
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
    ...mapGetters('dashboard', [
      'trendingConversations',
      'conversations'
    ])
  }
}
</script>
