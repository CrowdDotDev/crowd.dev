<template>
  <div class="filter-type-search">
    <el-input
      v-model="model"
      :placeholder="placeholder"
      :prefix-icon="SearchIcon"
      clearable
      data-qa="filter-search"
      @input="debouncedChange"
    >
      <template #append>
        <slot name="dropdown" />
      </template>
    </el-input>
  </div>
</template>
<script setup>
import {
  computed,
  defineEmits,
  defineProps,
  h,
  ref,
  watch,
  onMounted,
} from 'vue';
import debounce from 'lodash/debounce';
import { useStore } from 'vuex';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  [],
);

const props = defineProps({
  module: {
    type: String,
    default: null,
  },
  filter: {
    type: Object,
    default: () => {},
  },
  placeholder: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(['change']);

const store = useStore();

const { activeView } = mapGetters(props.module);

const model = ref('');
const storeSearch = computed(() => (
  store.state[props.module].views[activeView.value.id]
    .filter.attributes.search?.value || ''
));

// Reset model value when store is resetted
watch(
  () => storeSearch.value,
  (newValue) => {
    if (!newValue && newValue !== model.value) {
      model.value = '';
    }
  },
);

// Reset model value when tab changes
watch(
  () => activeView.value,
  (newActiveView, oldActiveView) => {
    if (newActiveView.id !== oldActiveView.id) {
      model.value = '';
    }
  },
);

const debouncedChange = debounce((value) => {
  emit('change', {
    ...props.filter,
    value,
  });
}, 300);

const setModelValue = (value) => {
  model.value = value;
  emit('change', {
    ...props.filter,
    value,
  });
};

onMounted(() => {
  if (model.value !== storeSearch.value) {
    setModelValue(storeSearch.value);
  }
});
</script>
