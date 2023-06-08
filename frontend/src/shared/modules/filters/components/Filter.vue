<template>
  <div class="mb-4">
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
        <el-tooltip
          effect="dark"
          :content="`${filters.relation} → ${filters.relation === 'and' ? 'or' : 'and'}`"
          placement="top"
        >
          <div
            v-if="fi > 0"
            class="border text-xs border-gray-100 rounded-md shadow w-10 justify-center
          h-8 flex font-medium items-center py-1 px-2 bg-white cursor-pointer hover:bg-gray-100 transition mr-3 mb-4"
            @click="switchOperator"
          >
            {{ filters.relation }}
          </div>
        </el-tooltip>

        <!-- Filter -->
        <cr-filter-item
          v-model="filters[filter]"
          v-model:open="open"
          :config="configuration[filter]"
          class="mr-3 mb-4"
          @remove="removeFilter(filter)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineProps, onMounted, ref, watch,
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
  hash?: string,
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
    alignFilterList(value);
    emit('update:modelValue', value);
  },
});

const configuration = computed(() => ({
  ...props.config,
  ...props.customConfig,
}));

const filterList = ref<string[]>([]);
const cachedRelation = ref<'and' | 'or'>('and');

const switchOperator = () => {
  filters.value.relation = filters.value.relation === 'and' ? 'or' : 'and';
};

const alignFilterList = (value: Filter) => {
  const {
    settings, search, relation, order, pagination, ...filterValues
  } = value;
  if (JSON.stringify(relation) !== JSON.stringify(cachedRelation.value)) {
    cachedRelation.value = relation;
    return;
  }
  filterList.value = Object.keys(filterValues);
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
  alignFilterList(value);
  const query = setQuery(value);
  router.push({ query, hash: props.hash ? `#${props.hash}` : undefined });
}, { deep: true });

// Watch for query change
watch(() => route.query, (query) => {
  const parsed = parseQuery(query, {
    ...props.config,
    ...props.customConfig,
  }, props.savedViewsConfig);
  if (!parsed || Object.keys(parsed).length === 0) {
    const query = setQuery(props.modelValue);
    router.push({ query, hash: props.hash ? `#${props.hash}` : undefined });
    return;
  }
  if (JSON.stringify(parsed) !== JSON.stringify(filters.value)) {
    filters.value = parsed as Filter;
  }
}, { immediate: true });

onMounted(() => {
  if (!!filters.value && Object.keys(filters.value).length > 0) {
    alignFilterList(filters.value);
    fetch(filters.value);
  }
});
</script>

<script lang="ts">
export default {
  name: 'CrFilter',
};
</script>
