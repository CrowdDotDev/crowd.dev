<template>
  <el-input
    v-model="searchInput"
    clearable
    :placeholder="placeholder"
    :prefix-icon="SearchIcon"
    @input="debouncedChange"
  />
</template>

<script setup>
import { h, ref } from 'vue';
import debounce from 'lodash/debounce';

const emit = defineEmits(['onChange']);
defineProps({
  placeholder: {
    type: String,
    default: () => null,
  },
});

const searchInput = ref();

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  [],
);

const debouncedChange = debounce((value) => {
  emit('onChange', value);
}, 300);
</script>

<script>
export default {
  name: 'AppLfSearchInput',
};
</script>
