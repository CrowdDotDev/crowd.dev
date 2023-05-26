<template>
  <div class="mb-8">
    <div class="flex justify-end pb-4">
      <cr-filter-search v-model="filters.search" :placeholder="props.searchConfig.placeholder">
        <template #append>
          <cr-filter-dropdown v-model="filterList" :config="props.config" :custom-config="props.customConfig || {}" @open="open = $event" />
        </template>
      </cr-filter-search>
    </div>
    <div class="flex items-center flex-wrap">
      <template v-for="(filter, fi) of filterList" :key="filter">
        <!-- Operator -->
        <div
          v-if="fi > 0"
          class="border text-xs border-gray-100 rounded-md shadow uppercase
          h-8 flex font-medium items-center py-1 px-2 bg-white cursor-pointer hover:bg-gray-100 transition mr-4 mb-2"
          @click="switchOperator"
        >
          {{ filters.relation }}
        </div>
        <!-- Filter -->
        <cr-filter-item
          v-model="filters[filter]"
          v-model:open="open"
          :config="configuration[filter]"
          class="mr-4 mb-2"
          @remove="removeFilter(filter)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineProps, ref, watch,
} from 'vue';
import { Filter, FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import CrFilterDropdown from '@/shared/modules/filters/components/FilterDropdown.vue';
import CrFilterItem from '@/shared/modules/filters/components/FilterItem.vue';
import CrFilterSearch from '@/shared/modules/filters/components/FilterSearch.vue';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import { SearchFilterConfig } from '@/shared/modules/filters/types/filterTypes/SearchFilterConfig';
import { useRoute, useRouter } from 'vue-router';
import { filterApiService } from '@/shared/modules/filters/services/filter-api.service';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import { SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const props = defineProps<{
  modelValue: Filter,
  config: Record<string, FilterConfig>,
  customConfig?: Record<string, FilterConfig>,
  searchConfig: SearchFilterConfig,
  savedViewsConfig?: SavedViewsConfig,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: Filter), (e: 'fetch', value: FilterQuery),}>();

const router = useRouter();
const route = useRoute();

const open = ref('');

const filters = computed<Filter>({
  get() {
    return props.modelValue;
  },
  set(value: Filter) {
    const {
      settings, search, relation, order, pagination, ...filterValues
    } = value;
    filterList.value = Object.keys(filterValues);
    emit('update:modelValue', value);
  },
});

const configuration = computed(() => ({
  ...props.config,
  ...props.customConfig,
}));

const filterList = ref<string[]>([]);

const switchOperator = () => {
  filters.value.relation = filters.value.relation === 'and' ? 'or' : 'and';
};

const removeFilter = (key) => {
  open.value = '';
  filterList.value = filterList.value.filter((el) => el !== key);
  delete filters.value[key];
};

const { setQuery, parseQuery } = filterQueryService();
const { buildApiFilter } = filterApiService();

const fetch = (value: Filter) => {
  const data = buildApiFilter(value, { ...props.config, ...props.customConfig }, props.searchConfig, props.savedViewsConfig);
  emit('fetch', data);
};

watch(() => filters.value, (value: Filter) => {
  fetch(value);
  const {
    settings, search, relation, order, pagination, ...filterValues
  } = value;
  filterList.value = Object.keys(filterValues);
  const query = setQuery(value);
  router.push({ query });
}, { deep: true });

// Watch for query change
watch(() => route.query, (query) => {
  const parsed = parseQuery(query, {
    ...props.config,
    ...props.customConfig,
  }, props.savedViewsConfig);
  if (!parsed || Object.keys(parsed).length === 0) {
    const query = setQuery(props.modelValue);
    router.push({ query });
    return;
  }
  if (JSON.stringify(parsed) !== JSON.stringify(filters.value)) {
    filters.value = parsed as Filter;
  }
}, { immediate: true });
</script>

<script lang="ts">
export default {
  name: 'CrFilter',
};
</script>
