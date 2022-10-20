<template>
  <div class="filter-type-search">
    <el-input
      v-model="model"
      :placeholder="placeholder"
      :prefix-icon="SearchIcon"
      clearable
    >
      <template #append>
        <slot name="dropdown"></slot>
      </template>
    </el-input>
  </div>
</template>
<script setup>
import {
  h,
  ref,
  defineEmits,
  defineProps,
  watch
} from 'vue'
import debounce from 'lodash/debounce'

const props = defineProps({
  module: {
    type: String,
    default: null
  },
  filter: {
    type: Object,
    default: () => {}
  },
  placeholder: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['change'])
const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  []
)

const model = ref('')

const debouncedChange = debounce(() => {
  emit('change', {
    ...props.filter,
    value: model.value
  })
}, 300)

watch(model, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    debouncedChange()
  }
})
</script>
