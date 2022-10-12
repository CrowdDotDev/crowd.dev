<template>
  <div class="filter-type-search">
    <el-input
      v-model="model"
      placeholder="Search members"
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
import { h, ref, defineEmits, watch } from 'vue'
import debounce from 'lodash/debounce'

const emit = defineEmits(['change'])
const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  []
)

const model = ref('')

const debouncedChange = debounce(() => {
  emit('change', {
    name: 'search',
    value: model.value,
    defaultValue: '',
    operator: null,
    defaultOperator: null,
    type: 'search'
  })
}, 300)

watch(model, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    debouncedChange()
  }
})
</script>
