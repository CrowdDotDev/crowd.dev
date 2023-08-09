<template>
  <div class="pt-3">
    <cr-filter
      v-model="filters"
      :config="activityFilters"
      :search-config="activitySearchFilter"
      hash="activity"
      @fetch="fetch($event)"
    />
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
            :page-size="Number(pagination.perPage)"
            :total="totalActivities"
            :current-page="pagination.page"
            :has-page-counter="false"
            :sorter="false"
            module="activity"
            position="top"
          />
        </div>

        <!-- Activity item list -->
        <app-activity-item
          v-for="activity of activities"
          :key="activity.id"
          :activity="activity"
          class="mb-6"
          v-bind="cardOptions"
          @open-conversation="conversationId = $event"
          @edit="emit('edit', activity)"
          @activity-destroyed="fetch(savedFilterBody)"
        />

        <!-- Load more button -->
        <app-load-more
          :is-visible="isLoadMoreVisible"
          :is-loading="loading"
          :fetch-fn="onLoadMore"
        />
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
import AppActivityItem from '@/modules/activity/components/activity-item.vue';
import AppConversationDrawer from '@/modules/conversation/components/conversation-drawer.vue';
import AppPaginationSorter from '@/shared/pagination/pagination-sorter.vue';
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { useActivityStore } from '@/modules/activity/store/pinia';
import { storeToRefs } from 'pinia';
import { activityFilters, activitySearchFilter } from '@/modules/activity/config/filters/main';
import AppLoadMore from '@/shared/button/load-more.vue';

const sorterFilter = ref('trending');
const conversationId = ref(null);

defineProps({
  cardOptions: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});

const emit = defineEmits(['edit']);

const activityStore = useActivityStore();
const {
  filters, activities, totalActivities, savedFilterBody, pagination,
} = storeToRefs(activityStore);
const { fetchActivities } = activityStore;

const loading = ref(false);

const emptyState = computed(() => ({
  title: 'No activities found',
  description:
        "We couldn't find any results that match your search criteria, please try a different query",
}));

const isLoadMoreVisible = computed(() => (
  pagination.value.page
      * pagination.value.perPage
    < totalActivities.value
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
  filter, offset, limit, orderBy, body, append,
}) => {
  loading.value = true;
  fetchActivities({
    body: {
      ...body,
      filter: {
        ...filter,
        member: {
          isTeamMember: { not: true },
          isBot: { not: true },
        },
      },
      offset,
      limit,
      orderBy,
    },
    append,
  })
    .finally(() => {
      loading.value = false;
    });
};
</script>

<script>
export default {
  name: 'AppActivityList',
};
</script>
