<template>
  <div>
    <div v-if="conversations.loading">
      <app-dashboard-conversation-item
        v-for="(el, ci) of new Array(3)"
        :key="el"
        :class="{
          'border-b': ci < trendingConversations.length - 1
        }"
        :loading="true"
      />
    </div>
    <div v-else>
      <app-dashboard-conversation-item
        v-for="(conversation, ci) of trendingConversations"
        :key="conversation.id"
        :class="{
          'border-b': ci < trendingConversations.length - 1
        }"
        :conversation="conversation"
      />
      <div v-if="trendingConversations.length === 0">
        <div class="flex justify-center pt-16">
          <i
            class="ri-question-answer-line text-4xl h-12 text-gray-300"
          ></i>
        </div>
        <p
          class="text-xs leading-5 text-center italic text-gray-400 pt-4 pb-12"
        >
          No conversations during this period
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
import AppDashboardConversationItem from '@/modules/dashboard/components/conversations/dashboard-conversation-item'
export default {
  name: 'AppDashboardConversationList',
  components: { AppDashboardConversationItem },
  emits: { count: null },
  computed: {
    ...mapGetters('dashboard', [
      'trendingConversations',
      'conversations'
    ])
  }
}
</script>
