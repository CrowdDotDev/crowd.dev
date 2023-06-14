<template>
  <div class="flex items-end justify-between mb-6 h-8">
    <div class="tabs flex-grow">
      <el-tabs v-model="selectedTab" @tab-change="onTabChange($event)">
        <el-tab-pane
          :label="props.config.defaultView.label"
          name=""
        />
        <el-tab-pane
          v-for="view of props.views"
          :key="view.id"
          :label="view.label"
          :name="view.id"
        />
      </el-tabs>
    </div>
    <div v-if="hasChanged" class="border-b-2 border-[#e4e7ed] flex-grow flex justify-end -mb-px">
      <el-button class="btn btn-brand btn-brand--transparent btn--md inset-y-0" @click="reset()">
        Reset view
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineProps, ref, watch,
} from 'vue';
import { Filter, FilterObject } from '@/shared/modules/filters/types/FilterConfig';
import { SavedView, SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { isEqual } from 'lodash';

const props = defineProps<{
  modelValue: Filter,
  config: SavedViewsConfig,
  views: SavedView[]
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: Filter)}>();

const filters = computed<Filter>({
  get() {
    return props.modelValue;
  },
  set(value: Filter) {
    emit('update:modelValue', value);
  },
});

const selectedTab = ref<string>('');

const getView = (id: string): SavedView => {
  if (id.length > 0) {
    const view = props.views.find((v) => v.id === id);
    if (view) {
      return view;
    }
  }
  return props.config.defaultView;
};

const currentView = computed<SavedView>(() => getView(selectedTab.value));

const compareFilterToCurrentValues = (filter: FilterObject): boolean => {
  const compareFilter = {
    ...filter,
  };
  const currentFilter = {
    ...props.modelValue,
  };
  delete currentFilter.pagination;
  delete compareFilter.pagination;

  return isEqual(compareFilter, currentFilter);
};

const hasChanged = computed<boolean>(() => {
  const viewFilter = currentView.value.filter;
  return !compareFilterToCurrentValues(viewFilter);
});

const onTabChange = (id: string) => {
  const { filter } = getView(id);
  if (filter) {
    filters.value = {
      ...filter,
      pagination: {
        page: 1,
        perPage: filters.value.pagination.perPage,
      },
    };
  }
};

// Reset to current view
const reset = () => {
  filters.value = {
    ...currentView.value.filter,
    pagination: {
      page: 1,
      perPage: filters.value.pagination.perPage,
    },
  };
};

// Change tab if filters match
watch(() => props.modelValue, (filter: Filter) => {
  if (compareFilterToCurrentValues(props.config.defaultView.filter)) {
    selectedTab.value = '';
    return;
  }
  const matchingView = props.views.find((view) => compareFilterToCurrentValues(view.filter));
  if (matchingView) {
    selectedTab.value = matchingView.id;
  }
}, { deep: true });
</script>

<script lang="ts">
export default {
  name: 'CrSavedViews',
};
</script>

<style lang="scss" scoped>
.tabs {
  width: calc(100% - 100px)
}
</style>
