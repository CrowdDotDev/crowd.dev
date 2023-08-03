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
import { h, ref, watch } from 'vue';
import debounce from 'lodash/debounce';
import { useRoute } from 'vue-router';

const route = useRoute();
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

watch(() => route.query.activeTab, (newActiveTab, oldActiveTab) => {
  if (newActiveTab !== oldActiveTab) {
    searchInput.value = null;
  }
});
</script>

<script>
export default {
  name: 'AppLfSearchInput',
};
</script>
