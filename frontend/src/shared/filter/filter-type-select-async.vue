<template>
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
    <div class="filter-content-wrapper mb-4">
      <el-dropdown-item
        v-for="option of computedOptions"
        :key="option.id"
        @click.prevent="handleOptionClick(option)"
      >
        {{ option.label }}
      </el-dropdown-item>
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner"
      />
      <div
        v-else-if="computedOptions.length === 0"
        class="text-gray-400 px-4 pt-2"
      >
        No options left for this query
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppFilterTypeSelectAsync'
}
</script>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  reactive,
  ref,
  watch
} from 'vue'
import filterFunction from '@/shared/filter/filter-function'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  isExpanded: {
    type: Boolean,
    default: false
  },
  fetchFn: {
    type: Function,
    default: () => {}
  }
})

const emit = defineEmits(['update:modelValue'])
const model = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})
const expanded = computed(() => props.isExpanded)
const loading = ref(false)
const query = ref('')
const queryInputRef = ref(null)
const limit = ref(10)
const noMore = ref(false)
const options = reactive([])
const computedOptions = computed(() => {
  return options.filter((o) => {
    return (
      filterFunction(o, query.value) &&
      model.value.findIndex((i) => i.id === o.id) === -1
    )
  })
})

watch(expanded, async (newValue) => {
  if (newValue) {
    await fetchOptions()
    queryInputRef.value.focus()
  }
})

watch(query, async (newValue, oldValue) => {
  if (newValue !== oldValue) {
    await fetchOptions()
  }
})

const handleOptionClick = (option) => {
  model.value.push(option)
}

const fetchOptions = async () => {
  if (noMore.value) {
    return
  }
  loading.value = true
  const data = await props.fetchFn(query.value, limit.value)
  loading.value = false
  options.length = 0
  data.forEach((r) => {
    if (options.findIndex((o) => o.id === r.id) === -1) {
      options.push({
        id: r.id,
        label: r.label
      })
    }
  })
}
const remove = (index) => {
  model.value.splice(index, 1)
}
const removeLastKeyword = () => {
  if (query.value && query.value !== '') {
    return
  }
  model.value.pop()
}
</script>

<style lang="scss">
.filter-type-select-async {
  @apply -m-2;
  &-input {
    @apply border-b border-gray-200 mb-2 p-2;
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
