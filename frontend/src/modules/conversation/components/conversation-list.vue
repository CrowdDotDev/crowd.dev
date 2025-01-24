<template>
  <div class="pt-3">
    <lf-filter
      v-model="filters"
      :config="conversationFilters"
      :search-config="conversationSearchFilter"
      hash="conversation"
      @fetch="fetch($event)"
    />
    <div
      v-if="loading && !conversations.length"
      class="flex flex-col items-center mt-10"
    >
      <div
        class="h-16 !relative !min-h-5 flex justify-center items-center"
      >
        <div class="animate-spin w-fit">
          <div class="custom-spinner" />
        </div>
      </div>
      <div class="text-gray-500 italic text-xs">
        This might take up to 10 seconds for a large project group
      </div>
    </div>
    <div v-else>
      <!-- Empty state -->
      <app-empty-state-cta
        v-if="conversations.length === 0"
        icon="ri-comments-question-check-"
        :title="emptyState.title"
        :description="emptyState.description"
      />

      <div v-else>
        <div class="mb-4">
          <!-- <app-pagination-sorter
            v-model="sorterFilter"
            :page-size="Number(pagination.perPage)"
            :total="totalConversations"
            :current-page="pagination.page"
            :has-page-counter="false"
            :sorter="false"
            module="conversation"
            position="top"
          /> -->
        </div>

        <!-- Conversation item list -->
        <app-conversation-item
          v-for="conversation of conversations"
          :key="conversation?.id"
          :conversation="conversation"
          @details="conversationId = conversation.id"
          @reload="reload()"
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
import LfFilter from '@/shared/modules/filters/components/Filter.vue';
import { useConversationStore } from '@/modules/conversation/store';
import { storeToRefs } from 'pinia';
import { conversationFilters, conversationSearchFilter } from '@/modules/conversation/config/filters/main';
import AppLoadMore from '@/shared/button/load-more.vue';
import moment from 'moment/moment';

const conversationId = ref(null);

defineProps({
  itemsAsCards: {
    type: Boolean,
    default: false,
  },
});

const conversationStore = useConversationStore();
const {
  filters, conversations, totalConversations, savedFilterBody, limit, lastActive,
} = storeToRefs(conversationStore);
const { fetchConversation } = conversationStore;

const loading = ref(false);

filters.value = {
  search: '',
  relation: 'and',
  order: {
    prop: 'lastActive',
    order: 'descending',
  },
  lastActivityDate: {
    operator: 'gt',
    value: moment().subtract(7, 'day').format('YYYY-MM-DD'),
    include: true,
  },
};

// const sorterFilter = ref('recentActivity');

const emptyState = computed(() => ({
  title: 'No conversations found',
  description:
        "We couldn't find any results that match your search criteria, please try a different query",
}));

const isLoadMoreVisible = computed(() => conversations.value.length < totalConversations.value);

const onLoadMore = () => {
  lastActive.value = conversations.value[conversations.value.length - 1].lastActive;

  if (savedFilterBody.value.and) {
    savedFilterBody.value.and.push({
      lastActive: {
        lte: lastActive.value,
      },
    });
  } else {
    savedFilterBody.value.and = [
      {
        lastActive: {
          lte: lastActive.value,
        },
      },
    ];
  }

  fetch({
    ...savedFilterBody.value,
    limit: limit.value,
    append: true,
  });
};

const reload = () => {
  lastActive.value = conversations.value[conversations.value.length - 1].lastActive;

  if (savedFilterBody.value.and) {
    savedFilterBody.value.and.push({
      lastActive: {
        lte: lastActive.value,
      },
    });
  } else {
    savedFilterBody.value.and = [
      {
        lastActive: {
          lte: lastActive.value,
        },
      },
    ];
  }

  fetch({
    ...savedFilterBody.value,
    limit: limit.value,
    append: false,
  });
};

const fetch = ({
  filter, limit = 20, orderBy, body, append,
}) => {
  loading.value = true;

  const payloadFilter = { ...filter };

  if (payloadFilter.and) {
    payloadFilter.and.push({
      lastActive: {
        lte: lastActive.value,
      },
    });
  } else {
    payloadFilter.and = [
      {
        lastActive: {
          lte: lastActive.value,
        },
      },
    ];
  }

  fetchConversation({
    ...body,
    filter: payloadFilter,
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
