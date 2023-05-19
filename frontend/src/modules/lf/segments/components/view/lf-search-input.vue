<template>
  <el-input
    v-model="searchInput"
    :placeholder="placeholder"
    :prefix-icon="SearchIcon"
  />
</template>

<script setup>
import { h, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: () => null,
  },
  updateFn: {
    type: Function,
    default: () => {},
  },
});

const searchInput = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    props.updateFn(v);
  },
});

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  [],
);
</script>

<script>
export default {
  name: 'AppLfSearchInput',
};
</script>
