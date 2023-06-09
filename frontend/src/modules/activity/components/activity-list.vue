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
import AppActivityItem from '@/modules/activity/components/activity-item.vue';
import AppConversationDrawer from '@/modules/conversation/components/conversation-drawer.vue';
import AppPaginationSorter from '@/shared/pagination/pagination-sorter.vue';
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { useActivityStore } from '@/modules/activity/store/pinia';
import { storeToRefs } from 'pinia';
import { activityFilters, activitySearchFilter } from '@/modules/activity/config/filters/main';

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
const { filters, activities, totalActivities } = storeToRefs(activityStore);
const { fetchActivities } = activityStore;

const loading = ref(false);

const emptyState = computed(() => ({
  title: 'No activities found',
  description:
        "We couldn't find any results that match your search criteria, please try a different query",
}));

const pagination = computed(
  () => filters.value.pagination,
);

const isLoadMoreVisible = computed(() => (
  pagination.value.page
      * pagination.value.perPage
    < totalActivities
));

const onLoadMore = () => {
  filters.value.pagination.page += 1;
};

const fetch = ({
  filter, offset, limit, orderBy, body,
}) => {
  loading.value = true;
  fetchActivities({
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
