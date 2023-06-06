<template>
  <app-include-toggle
    v-if="!isCustom"
    v-model="includeModel"
    class="-ml-4"
  />
  <div class="filter-type-select-async">
    <div class="filter-type-select-async-input">
      <div
        class="input-wrapper"
        @click="queryInputRef.focus()"
      >
        <el-tag
          v-for="(tag, index) in model"
          v-bind="$attrs"
          :key="tag"
          size="small"
          type="info"
          effect="light"
          :disable-transitions="true"
          :closable="true"
          @close="remove(index)"
        >
          {{ tag.label }}
        </el-tag>
        <input
          ref="queryInputRef"
          v-model="query"
          class="el-keywords-input"
          :placeholder="
            model.length === 0 ? 'Select options' : ''
          "
          autocomplete="off"
          data-lpignore="true"
          @keydown.delete.stop="removeLastKeyword"
        />
      </div>
    </div>
    <div
      class="filter-type-select filter-content-wrapper mb-4 p-2"
    >
      <div
        v-for="option of computedOptions"
        :key="option.id"
        class="filter-type-select-option"
        @click="handleOptionClick(option)"
      >
        {{ option.label }}
      </div>
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner"
      />
      <div
        v-else-if="computedOptions.length === 0"
        class="text-gray-400 px-2 pt-2"
      >
        No options left for this query
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  reactive,
  ref,
  watch,
  onMounted,
} from 'vue';

import queryFilterFunction from '@/shared/filter/helpers/query-filter';

const props = defineProps({
  value: {
    type: Array,
    default: () => [],
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  fetchFn: {
    type: Function,
    default: () => {},
  },
  include: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:value', 'update:include']);
const model = computed({
  get() {
    return props.value;
  },
  set(v) {
    emit('update:value', v);
  },
});
const includeModel = computed({
  get() {
    return props.include;
  },
  set(v) {
    emit('update:include', v);
  },
});
const expanded = computed(() => props.isExpanded);
const loading = ref(false);
const query = ref('');
const queryInputRef = ref(null);
const limit = ref(10);
const noMore = ref(false);
const options = reactive([]);
const computedOptions = computed(() => options.filter((o) => (
  queryFilterFunction(o, query.value)
      && model.value.findIndex((i) => i.id === o.id) === -1
)));

const fetchOptions = async () => {
  if (noMore.value) {
    return;
  }
  loading.value = true;
  const data = await props.fetchFn({
    query: query.value,
    limit: limit.value,
  });
  loading.value = false;
  options.length = 0;
  data.forEach((r) => {
    if (options.findIndex((o) => o.id === r.id) === -1) {
      options.push({
        id: r.id,
        label: r.label,
      });
    }
  });
};

const init = async () => {
  await fetchOptions();
  queryInputRef.value.focus();
};

watch(expanded, async (newValue) => {
  if (newValue) {
    await init();
  }
});

watch(query, async (newValue, oldValue) => {
  if (newValue !== oldValue) {
    await fetchOptions();
  }
});

onMounted(async () => {
  await init();
});

const handleOptionClick = (option) => {
  model.value = [...model.value, option];
  query.value = '';
};

const remove = (index) => {
  model.value = [...model.value].filter((item, i) => index !== i);
};
const removeLastKeyword = () => {
  if (query.value && query.value !== '') {
    return;
  }
  const arr = [...model.value];
  arr.pop();
  model.value = arr;
};
</script>

<script>
export default {
  name: 'AppFilterTypeSelectAsync',
};
</script>

<style lang="scss">
.filter-type-select-async {
  @apply -m-2;
  &-input {
    @apply border-b border-gray-200 p-2;
  }
  .input-wrapper {
    @apply min-h-8 bg-gray-50 shadow-none border-none rounded-md max-h-12 overflow-auto;
    .el-tag {
      margin: 4px 0 4px 4px;
    }
    input {
      &,
      &:hover,
      &:focus {
        @apply bg-gray-50 shadow-none border-none outline-none h-full px-2 min-h-8;
      }
    }
  }
}
</style>
