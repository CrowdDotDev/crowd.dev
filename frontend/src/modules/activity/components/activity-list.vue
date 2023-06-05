<template>
  <div class="pt-3">
    <div
      v-if="loading && !activities.length"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    />
    <div v-else>
      <!-- Empty State -->
      <app-empty-state-cta
        v-if="activities.length === 0"
        icon="ri-list-check-2"
        :title="emptyState.title"
        :description="emptyState.description"
      />

      <div v-else>
        <!-- Sorter -->
        <div class="mb-4">
          <app-pagination-sorter
            v-model="sorterFilter"
            :page-size="Number(pagination.pageSize)"
            :total="count"
            :current-page="pagination.currentPage"
            :has-page-counter="false"
            :sorter="false"
            module="activity"
            position="top"
          />
        </div>

        <!-- Activity item list -->
        <app-activity-item
          v-for="activity of activities"
          :key="activity?.id"
          :activity="activity"
          class="mb-6"
          v-bind="cardOptions"
          @open-conversation="conversationId = $event"
          @edit="emit('edit', activity)"
        />

        <!-- Load more button -->
        <div
          v-if="isLoadMoreVisible"
          class="flex grow justify-center pt-4"
        >
          <div
            v-if="loading"
            v-loading="loading"
            class="app-page-spinner h-16 w-16 !relative !min-h-fit"
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
    <app-conversation-drawer
      :expand="conversationId != null"
      :conversation-id="conversationId"
      @close="conversationId = null"
    />
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import AppActivityItem from '@/modules/activity/components/activity-item.vue';
import AppConversationDrawer from '@/modules/conversation/components/conversation-drawer.vue';
import AppPaginationSorter from '@/shared/pagination/pagination-sorter.vue';

const store = useStore();
const sorterFilter = ref('trending');
const conversationId = ref(null);

defineProps({
  activities: {
    type: Array,
    default: () => {},
  },
  loading: {
    type: Boolean,
    default: false,
  },
  cardOptions: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});

const emit = defineEmits(['edit']);

const activeView = computed(
  () => store.getters['activity/activeView'],
);
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
      title: 'No activities found',
      description:
        "We couldn't find any results that match your search criteria, please try a different query",
    };
  }

  return {
    title: 'No activities yet',
    description:
      "We couldn't track any community member activities",
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

const onLoadMore = () => {
  store.dispatch(
    'activity/doChangePaginationCurrentPage',
    pagination.value.currentPage + 1,
  );
};
</script>

<script>
export default {
  name: 'AppActivityList',
};
</script>
