<template>
  <div class="pt-3">
    <cr-filter
      v-model="filters"
      :config="conversationFilters"
      :search-config="conversationSearchFilter"
      hash="conversation"
      @fetch="fetch($event)"
    />
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
            :page-size="Number(pagination.perPage)"
            :total="totalConversations"
            :current-page="pagination.page"
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
import AppConversationItem from '@/modules/conversation/components/conversation-item.vue';
import AppConversationDrawer from '@/modules/conversation/components/conversation-drawer.vue';
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { useConversationStore } from '@/modules/conversation/store';
import { storeToRefs } from 'pinia';
import { conversationFilters, conversationSearchFilter } from '@/modules/conversation/config/filters/main';

const conversationId = ref(null);

defineProps({
  itemsAsCards: {
    type: Boolean,
    default: false,
  },
});

const conversationStore = useConversationStore();
const { filters, conversations, totalConversations } = storeToRefs(conversationStore);
const { fetchConversation } = conversationStore;

const loading = ref(false);

const sorterFilter = computed(() => (filters.value.order.prop === 'activityCount'
  ? 'trending'
  : 'recentActivity'));

const emptyState = computed(() => ({
  title: 'No conversations found',
  description:
        "We couldn't find any results that match your search criteria, please try a different query",
}));

const doChangeFilter = (filter) => {
  filters.value.order = {
    prop: filter === 'recentActivity' ? 'lastActive' : 'activityCount',
    order: 'descending',
  };
};

const pagination = computed(
  () => filters.value.pagination,
);
const isLoadMoreVisible = computed(() => (
  pagination.value.page
      * pagination.value.perPage
    < totalConversations
));

const onLoadMore = () => {
  filters.value.pagination.page += 1;
};

const fetch = ({
  filter, offset, limit, orderBy, body,
}) => {
  loading.value = true;
  fetchConversation({
    ...body,
    filter,
    offset,
    limit,
    orderBy,
  })
    .finally(() => {
      loading.value = false;
    });
};
</script>

<script>
export default {
  name: 'AppConversationsList',
};
</script>
