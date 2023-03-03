<template>
  <div class="filter-type-search">
    <el-input
      v-model="model"
      :placeholder="placeholder"
      :prefix-icon="SearchIcon"
      clearable
      @input="debouncedChange"
    >
      <template #append>
        <slot name="dropdown"></slot>
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
  onMounted
} from 'vue'
import debounce from 'lodash/debounce'
import { useStore } from 'vuex'

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  []
)

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

const store = useStore()

const model = ref('')
const storeSearch = computed(() => {
  const activeView =
    store.getters[`${props.module}/activeView`]

  return (
    store.state[props.module].views[activeView.id].filter
      .attributes.search?.value || ''
  )
})

// Reset model value when store is resetted
watch(
  () => storeSearch.value,
  (newValue) => {
    if (!newValue && newValue !== model.value) {
      model.value = ''
    }
  }
)

const debouncedChange = debounce((value) => {
  emit('change', {
    ...props.filter,
    value
  })
}, 300)

onMounted(() => {
  if (model.value !== storeSearch.value) {
    model.value = storeSearch.value
  }
})
</script>
