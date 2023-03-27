<template>
  <div
    class="grid grid-cols-3 md:grid-cols-2 gap-5 pr-8 pb-10 pl-3"
  >
    <div
      v-for="(_, i) in Array(3)"
      :key="i"
      class="col-span-1 flex flex-col gap-5"
    >
      <div
        v-for="(item, index) in getItemsInColumn(i)"
        :key="item.url"
      >
        <app-eagle-eye-result-card
          :result="item"
          :index="index * 3 + i"
        />
      </div>
    </div>
  </div>

  <!-- Bottom of feed message -->
  <app-empty-state
    v-if="showBottomFeedMessage"
    icon="ri-search-eye-line"
    description="We couldn't find any more results based on your feed setting."
    class="pb-12"
  />

  <!-- Load more button -->
  <div
    v-if="isLoadMoreVisible"
    class="flex grow justify-center pt-4 mb-12"
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
</template>

<script setup>
import { computed, defineProps } from 'vue';
import { useStore } from 'vuex';
import AppEagleEyeResultCard from '@/premium/eagle-eye/components/list/eagle-eye-result-card.vue';

const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
});

const store = useStore();
const activeView = computed(
  () => store.getters['eagleEye/activeView'],
);
const loading = computed(
  () => store.state.eagleEye.views[activeView.value.id].list
    .loading,
);
const count = computed(
  () => store.state.eagleEye.views[activeView.value.id].count,
);
const pagination = computed(
  () => store.getters['eagleEye/pagination'],
);

const isLoadMoreVisible = computed(() => {
  if (activeView.value.id === 'feed') {
    return false;
  }

  return (
    pagination.value.currentPage
      * pagination.value.pageSize
    < count.value
  );
});

const getItemsInColumn = (column) => props.list.filter(
  (_v, i) => (i - column) % 3 === 0,
);

const onLoadMore = () => {
  store.dispatch(
    'eagleEye/doChangePaginationCurrentPage',
    pagination.value.currentPage + 1,
  );
};

const showBottomFeedMessage = computed(() => activeView.value.id === 'feed');
</script>
