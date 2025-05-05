<template>
  <div>
    <el-select
      v-model="cForm.collectionsIds"
      filterable
      multiple
      :filter-method="onSearchInput"
      placeholder="Select collection(s)"
      class="w-full"
      popper-class="collection-infinite-select-dropdown"
    >
      <el-option
        v-for="item in collections"
        :key="item.id"
        :label="item.name"
        :value="item.id"
      />
      <el-option
        v-if="loading && collections.length > 0"
        :key="'loading'"
        label="Loading..."
        value=""
        disabled
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash';
import {
  nextTick, onMounted, reactive, ref,
} from 'vue';
import { CollectionsService } from '@/modules/admin/modules/collections/services/collections.service';
import Message from '@/shared/message/message';
import { CollectionModel } from '../../../collections/models/collection.model';
import { InsightsProjectAddFormModel } from '../../models/insights-project-add-form.model';

const props = defineProps<{
  form: InsightsProjectAddFormModel;
}>();

const cForm = reactive(props.form);

const loading = ref(false);
const collections = ref<CollectionModel[]>([]);
const page = ref(0);
const pageSize = 20;
const noMoreData = ref(false);
const searchQuery = ref('');
let scrollContainer: HTMLElement | null = null;

// Your API service method
function fetchCollections(query = '', pageNum = 0) {
  loading.value = true;
  CollectionsService.list({
    filter: query
      ? {
        name: {
          like: `%${query}%`,
        },
      }
      : {},
    offset: pageNum * pageSize,
    limit: pageSize,
  })
    .then((res: { rows: CollectionModel[], total: string }) => {
      const { rows } = res;
      const selectedItems = cForm.collections;
      if (pageNum === 0) {
        collections.value = [...selectedItems, ...rows].reduce((acc, item) => {
          if (!acc.find((i) => i.id === item.id)) acc.push(item);
          return acc;
        }, [] as CollectionModel[]);
      } else {
        collections.value = [...collections.value, ...rows].reduce((acc, item) => {
          if (!acc.find((i) => i.id === item.id)) acc.push(item);
          return acc;
        }, [] as CollectionModel[]);
      }

      noMoreData.value = collections.value.length >= +res.total;
    })
    .catch(() => {
      Message.closeAll();
      Message.error('Failed to load collections');
    })
    .finally(() => {
      loading.value = false;
    });
}

// Debounced search input handler
const debouncedSearch = debounce((query: string) => {
  page.value = 0;
  noMoreData.value = false;
  fetchCollections(query, page.value);
}, 300);

function onSearchInput(query: string) {
  searchQuery.value = query;
  debouncedSearch(query);
}

// Infinite scroll handler
function onScroll(e: Event) {
  if (!scrollContainer) return;
  const threshold = 20;

  const target = e.target as HTMLElement;
  if (
    !loading.value
    && !noMoreData.value
    && target.scrollHeight - target.scrollTop - target.clientHeight < threshold
  ) {
    page.value += 1;
    fetchCollections(searchQuery.value, page.value);
  }
}

// Attach scroll listener after dropdown renders
onMounted(() => {
  fetchCollections('', 0);
  nextTick(() => {
    scrollContainer = document.querySelector(
      '.collection-infinite-select-dropdown .el-select-dropdown__wrap',
    );
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', onScroll);
    }
  });
});
</script>

<script lang="ts">
export default {
  name: 'LfInsightsProjectsAddCollectionDropdown',
};
</script>

<style>

.collection-infinite-select-dropdown .el-select-dropdown__wrap {
  max-height: 200px;
  overflow: auto;
}
</style>
