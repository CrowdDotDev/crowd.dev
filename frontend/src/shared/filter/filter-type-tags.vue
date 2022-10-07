<template>
  <div class="filter-type-tags">
    <div class="filter-type-tags-input">
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
      v-infinite-scroll="fetchOptions"
      class="filter-content-wrapper mb-4"
      :infinite-scroll-disabled="disabled"
    >
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
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppFilterTypeTags'
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

const emits = defineEmits(['update:modelValue'])
const model = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emits('update:modelValue', value)
  }
})
const expanded = computed(() => props.isExpanded)
const loading = ref(true)
const query = ref('')
const queryInputRef = ref(null)
const limit = ref(10)
const offset = ref(0)
const noMore = ref(false)
const disabled = computed(
  () => loading.value || noMore.value
)
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

const handleOptionClick = (option) => {
  model.value.push(option)
}

const fetchOptions = async () => {
  if (noMore.value) {
    return
  }
  loading.value = true
  const response = await props.fetchFn(
    {},
    'lastActive_DESC',
    limit.value,
    offset.value
  )
  loading.value = false
  if (response.rows.length < 10) {
    noMore.value = true
  } else {
    offset.value += limit.value
  }
  response.rows.forEach((r) => {
    if (options.findIndex((o) => o.id === r.id) === -1) {
      options.push({
        id: r.id,
        label: r.displayName
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
.filter-type-tags {
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
