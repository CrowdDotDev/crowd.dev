<template>
  <div>
    <app-filter-search
      v-if="search"
      :module="module"
      :filter="searchFilter"
      :placeholder="placeholder"
      class="mb-6"
      @change="handleFilterChange"
    >
      <template #dropdown>
        <slot name="dropdown" />
      </template>
    </app-filter-search>

    <div v-if="filtersArray.length > 0" class="filter-list">
      <div
        v-for="(filter, index) of filtersArray"
        :key="filter.name"
        class="flex items-center"
      >
        <app-filter-list-item
          :filter="filter"
          class="mx-2"
          @change="handleFilterChange"
          @destroy="handleFilterDestroy"
          @reset="handleFilterReset"
        />
        <app-filter-list-operator
          v-if="
            filtersArray.length > 1
              && index !== filtersArray.length - 1
          "
          :operator="operator"
          class="mx-2"
          @change="handleOperatorChanged"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import { defineProps, computed } from 'vue';
import AppFilterListItem from './filter-list-item.vue';
import AppFilterListOperator from './filter-list-operator.vue';

const props = defineProps({
  module: {
    type: String,
    required: true,
  },
  searchFilter: {
    type: Object,
    default: () => {},
  },
  placeholder: {
    type: String,
    required: true,
  },
  search: {
    type: Boolean,
    default: true,
  },
});

const store = useStore();
const activeView = computed(
  () => store.getters[`${props.module}/activeView`],
);
const operator = computed(
  () => store.state[props.module].views[activeView.value.id]
    .filter.operator,
);

const filters = computed(() => ({
  ...store.state[props.module].views[activeView.value.id]
    .filter.attributes,
}));
const filtersArray = computed(() => {
  let list = Object.values(filters.value).filter(
    (a) => a.type !== 'search' && a.show !== false,
  );
  list = list.map((p) => {
    if (p.name === 'skills') {
      return {
        ...p,
        type: 'select-filter',
      };
    }
    return p;
  });
  return list;
});

const handleFilterChange = (attribute) => {
  store.dispatch(
    `${props.module}/updateFilterAttribute`,
    attribute,
  );
};
const handleFilterDestroy = (attribute) => {
  store.dispatch(
    `${props.module}/destroyFilterAttribute`,
    attribute,
  );
};
const handleFilterReset = (attribute) => {
  store.dispatch(
    `${props.module}/resetFilterAttribute`,
    attribute,
  );
};
const handleOperatorChanged = (op) => {
  store.dispatch(
    `${props.module}/updateFilterOperator`,
    op,
  );
};
</script>

<script>
export default {
  name: 'AppFilterList',
};
</script>

<style lang="scss">
.filter-list {
  @apply flex items-center -mx-2 mb-2 flex-wrap;
}
</style>
