<template>
  <div>
    <div v-if="conversations.loading">
      <app-dashboard-conversation-item
        v-for="(el, ci) of new Array(2)"
        :key="el"
        :class="{
          'border-b': ci < trendingConversations.length - 1,
        }"
        :loading="true"
        @conversation-destroyed="refreshConversations"
      />
    </div>
    <div v-else>
      <app-dashboard-conversation-item
        v-for="(conversation, ci) of trendingConversations"
        :key="conversation.id"
        :class="{
          'border-b': ci < trendingConversations.length - 1,
        }"
        :conversation="conversation"
        @details="conversationId = conversation.id"
        @conversation-destroyed="refreshConversations"
      />

      <app-dashboard-empty-state
        v-if="trendingConversations.length === 0"
        icon-class="ri-question-answer-line"
        class="pt-20 pb-17"
      >
        No conversations during this period
      </app-dashboard-empty-state>
    </div>

    <div class="pt-3 pb-2 flex justify-center">
      <router-link
        :to="{
          name: 'activity',
          hash: '#conversation',
          query: {
            ...filterQueryService().setQuery(allConversationsFilter),
            projectGroup: selectedProjectGroup?.id,
          },
        }"
        class="text-red font-medium text-center text-xs leading-5 hover:underline"
      >
        All conversations
      </router-link>
    </div>
  </div>

  <app-conversation-drawer
    :expand="conversationId != null"
    :conversation-id="conversationId"
    @close="conversationId = null"
  />
</template>

<script>
import { mapGetters } from 'vuex';
import AppDashboardEmptyState from '@/modules/dashboard/components/dashboard-empty-state.vue';
import AppDashboardConversationItem from '@/modules/dashboard/components/conversations/dashboard-conversation-item.vue';
import AppConversationDrawer from '@/modules/conversation/components/conversation-drawer.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import moment from 'moment';

export default {
  name: 'AppDashboardConversationList',
  components: {
    AppDashboardEmptyState,
    AppConversationDrawer,
    AppDashboardConversationItem,
  },
  data() {
    return {
      conversationId: null,
      filterQueryService,
    };
  },
  computed: {
    ...mapGetters('dashboard', [
      'trendingConversations',
      'conversations',
    ]),
    selectedProjectGroup() {
      const lsSegmentsStore = useLfSegmentsStore();

      return storeToRefs(lsSegmentsStore).selectedProjectGroup.value;
    },
    allConversationsFilter() {
      return {
        search: '',
        relation: 'and',
        order: {
          prop: 'activityCount',
          order: 'descending',
        },
        lastActivityDate: {
          operator: 'gt',
          value: moment().utc().subtract(6, 'day').format('YYYY-MM-DD'),
          include: true,
        },
      };
    },
  },
  methods: {
    refreshConversations() {
      this.$store.dispatch(
        'dashboard/getTrendingConversations',
      );
    },
  },
};
</script>
