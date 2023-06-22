<template>
  <el-input
    id="filterSearch"
    ref="searchQueryInput"
    v-model="searchQuery"
    placeholder="Search..."
    class="lf-filter-input filter-dropdown-search"
    :prefix-icon="SearchIcon"
    data-qa="filter-list-search"
    @input="(value) => emit('onSearchChange', value)"
  />
  <div class="mt-13">
    <app-lf-radio-cascader
      v-model:options="modelOptions"
      empty-text="No projects found"
      :loading="loading"
      @on-change="(value) => emit('onChange', value)"
    />
  </div>
</template>

<script setup>
import {
  ref, h, computed,
} from 'vue';
import AppLfRadioCascader from '@/modules/lf/segments/components/filter/lf-radio-cascader.vue';

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
);

const emit = defineEmits(['update:options', 'onChange', 'onSearchChange']);
const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const modelOptions = computed({
  get() {
    return props.options;
  },
  set(v) {
    emit('update:options', v);
  },
});

const searchQuery = ref('');
const searchQueryInput = ref(null);
</script>

<script>
export default {
  name: 'AppLfProjectFilter',
};
</script>

<style lang="scss">
.lf-filter-input {
  @apply h-10 border-b border-gray-100 absolute pb-2 left-0;

  .el-input__wrapper {
    @apply px-4;
  }
}
</style>
