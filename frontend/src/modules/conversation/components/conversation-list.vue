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
      class="h-16 !relative !min-h-5 flex justify-center items-center"
    >
      <div class="animate-spin w-fit">
        <div class="custom-spinner" />
      </div>
    </div>
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
            :sorter="false"
            module="conversation"
            position="top"
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
        <app-load-more
          :is-visible="isLoadMoreVisible"
          :is-loading="loading"
          :fetch-fn="onLoadMore"
        />
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
import { computed, ref } from 'vue';
import AppConversationItem from '@/modules/conversation/components/conversation-item.vue';
import AppConversationDrawer from '@/modules/conversation/components/conversation-drawer.vue';
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { useConversationStore } from '@/modules/conversation/store';
import { storeToRefs } from 'pinia';
import { conversationFilters, conversationSearchFilter } from '@/modules/conversation/config/filters/main';
import AppLoadMore from '@/shared/button/load-more.vue';

const conversationId = ref(null);

defineProps({
  itemsAsCards: {
    type: Boolean,
    default: false,
  },
});

const conversationStore = useConversationStore();
const {
  filters, conversations, totalConversations, savedFilterBody, pagination,
} = storeToRefs(conversationStore);
const { fetchConversation } = conversationStore;

const loading = ref(false);

const sorterFilter = ref('recentActivity');

const emptyState = computed(() => ({
  title: 'No conversations found',
  description:
        "We couldn't find any results that match your search criteria, please try a different query",
}));

const isLoadMoreVisible = computed(() => (
  pagination.value.page
      * pagination.value.perPage
    < totalConversations.value
));

const onLoadMore = () => {
  pagination.value.page += 1;

  fetch({
    ...savedFilterBody.value,
    offset: (pagination.value.page - 1) * pagination.value.perPage,
    limit: pagination.value.perPage,
    append: true,
  });
};

const fetch = ({
  filter, offset = 0, limit = 20, orderBy, body, append,
}) => {
  loading.value = true;
  fetchConversation({
    ...body,
    filter,
    offset,
    limit,
    orderBy,
  }, false, append)
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
