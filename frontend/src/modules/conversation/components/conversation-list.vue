<template>
  <div class="pt-3">
    <div
      v-if="loading && !conversations.length"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    />
    <div v-else>
      <!-- Empty state -->
      <app-empty-state-cta
        v-if="conversations.length === 0"
        icon="ri-question-answer-line"
        :title="emptyState.title"
        :description="emptyState.description"
      />

      <div v-else>
        <div class="mb-4">
          <app-pagination-sorter
            v-model="sorterFilter"
            :page-size="Number(pagination.pageSize)"
            :total="count"
            :current-page="pagination.currentPage"
            :has-page-counter="false"
            module="conversation"
            position="top"
            @change-sorter="doChangeFilter"
          />
        </div>

        <!-- Conversation item list -->
        <app-conversation-item
          v-for="conversation of conversations"
          :key="conversation?.id"
          :conversation="conversation"
          @details="conversationId = conversation.id"
        />

        <!-- Load more button -->
        <div
          v-if="isLoadMoreVisible"
          class="flex grow justify-center pt-4"
        >
          <div
            v-if="loading"
            v-loading="loading"
            class="app-page-spinner h-16 !relative !min-h-5"
          />
          <el-button
            v-else
            class="btn btn-link btn-link--primary"
            @click="onLoadMore"
          >
            <i class="ri-arrow-down-line" /><span class="text-xs">Load more</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
  <app-conversation-drawer
    :expand="conversationId != null"
    :conversation-id="conversationId"
    @close="conversationId = null"
  />
</template>

<script setup>
import { defineProps, computed, ref } from 'vue';
import { useStore } from 'vuex';
import { TRENDING_CONVERSATIONS_FILTER } from '@/modules/activity/store/constants';
import AppConversationItem from '@/modules/conversation/components/conversation-item.vue';
import AppConversationDrawer from '@/modules/conversation/components/conversation-drawer.vue';
import AppPaginationSorter from '@/shared/pagination/pagination-sorter.vue';

const store = useStore();
const conversationId = ref(null);

defineProps({
  conversations: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  itemsAsCards: {
    type: Boolean,
    default: false,
  },
});

const activeView = computed(
  () => store.getters['activity/activeView'],
);
const sorterFilter = computed(() => (activeView.value?.sorter.prop === 'activityCount'
  ? 'trending'
  : 'recentActivity'));
const hasFilter = computed(() => {
  const parsedFilters = {
    ...activeView.value.filter.attributes,
  };

  // Remove search filter if value is empty
  if (!parsedFilters.search?.value) {
    delete parsedFilters.search;
  }

  return !!Object.keys(parsedFilters).length;
});
const emptyState = computed(() => {
  if (hasFilter.value) {
    return {
      title: 'No conversations found',
      description:
        "We couldn't find any results that match your search criteria, please try a different query",
    };
  }

  return {
    title: 'No conversations yet',
    description:
      "We couldn't track any conversations among your community members",
  };
});

const count = computed(() => store.state.activity.count);
const pagination = computed(
  () => store.getters['activity/pagination'],
);
const isLoadMoreVisible = computed(() => (
  pagination.value.currentPage
      * pagination.value.pageSize
    < count.value
));

const doChangeFilter = (filter) => {
  let sorter = 'lastActive';
  const payload = {
    activeView: activeView.value,
    attribute:
      TRENDING_CONVERSATIONS_FILTER.attributes.lastActive,
  };

  if (filter === 'trending') {
    // Add lastActive filter for 'Trending' sorter
    store.commit('activity/FILTER_ATTRIBUTE_ADDED', payload);
    sorter = 'activityCount';
  } else {
    // Remove lastActive filter for 'Most recent activity' sorter
    store.commit(
      'activity/FILTER_ATTRIBUTE_DESTROYED',
      payload,
    );
  }

  store.dispatch('activity/doChangeSort', {
    prop: sorter,
    order: 'descending',
  });
};

const onLoadMore = () => {
  const newPageSize = pagination.value.pageSize + 10;

  store.dispatch(
    'activity/doChangePaginationPageSize',
    newPageSize,
  );
};
</script>

<script>
export default {
  name: 'AppConversationsList',
};
</script>
