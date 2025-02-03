<template>
  <div class="pt-3">
    <lf-filter
      v-model="filters"
      :config="activityFilters"
      :search-config="activitySearchFilter"
      hash="activity"
      @fetch="fetch($event)"
    />
    <div
      v-if="loading && !activities.length"
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
      <!-- Empty State -->
      <app-empty-state-cta
        v-if="activities.length === 0"
        icon="list"
        :title="emptyState.title"
        :description="emptyState.description"
      />

      <div v-else>
        <!-- Sorter -->
        <div class="mb-4">
          <!-- <app-pagination-sorter
            v-model="sorterFilter"
            :page-size="Number(pagination.perPage)"
            :total="totalActivities"
            :current-page="pagination.page"
            :has-page-counter="false"
            :sorter="false"
            module="activity"
            position="top"
          /> -->
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
          @on-update="fetch(savedFilterBody)"
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
  computed,
  ref,
} from 'vue';
import AppActivityItem from '@/modules/activity/components/activity-item.vue';
import AppConversationDrawer from '@/modules/conversation/components/conversation-drawer.vue';
// import AppPaginationSorter from '@/shared/pagination/pagination-sorter.vue';
import AppEmptyStateCta from '@/shared/empty-state/empty-state-cta.vue';
import LfFilter from '@/shared/modules/filters/components/Filter.vue';
import { useActivityStore } from '@/modules/activity/store/pinia';
import { storeToRefs } from 'pinia';
import { activityFilters, activitySearchFilter } from '@/modules/activity/config/filters/main';
import AppLoadMore from '@/shared/button/load-more.vue';
import utcPlugin from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

dayjs.extend(utcPlugin);

// const sorterFilter = ref('trending');
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
  filters, activities, totalActivities, savedFilterBody, limit, timestamp,
} = storeToRefs(activityStore);
const { fetchActivities } = activityStore;

const loading = ref(false);

filters.value = {
  search: '',
  relation: 'and',
  order: {
    prop: 'timestamp',
    order: 'descending',
  },
  date: {
    include: true,
    value: dayjs().utc().subtract(6, 'day').format('YYYY-MM-DD'),
  },
};

const emptyState = computed(() => ({
  title: 'No activities found',
  description:
        "We couldn't find any results that match your search criteria, please try a different query",
}));

const isLoadMoreVisible = computed(() => activities.value.length < totalActivities.value);

const onLoadMore = () => {
  timestamp.value = activities.value.at(-1).timestamp;

  if (savedFilterBody.value.and) {
    savedFilterBody.value.and = savedFilterBody.value.and.reduce((acc, filter) => {
      const newFilter = { ...filter };

      if (newFilter.timestamp) {
        newFilter.timestamp = {
          ...newFilter.timestamp,
          lte: timestamp.value,
        };
      }

      acc.push(newFilter);

      return acc;
    }, []);
  } else {
    savedFilterBody.value.and = [
      {
        timestamp: {
          lte: timestamp.value,
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

const fetch = ({
  filter, limit = 50, orderBy, body, append,
}) => {
  loading.value = true;

  const payloadFilter = { ...filter };
  if (!payloadFilter.and) {
    payloadFilter.and = [];
  }

  payloadFilter.and.push({
    timestamp: {
      lte: timestamp.value,
    },
  });

  fetchActivities({
    body: {
      ...body,
      filter: payloadFilter,
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
