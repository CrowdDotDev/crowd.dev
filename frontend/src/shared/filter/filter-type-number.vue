<template>
  <div class="filter-with-operator-and-input">
    <app-inline-select-input
      v-model="operator"
      popper-placement="bottom-start"
      prefix="Number:"
      class="mb-2"
      :options="[
        { value: 'eq', label: 'is equal to' },
        {
          value: 'neq',
          label: 'is different than'
        },
        { value: '>', label: 'is bigger than' },
        { value: '<', label: 'is less than' },
        { value: '>=', label: 'is equal or bigger than' },
        { value: '<=', label: 'is equal or less than' },
        { value: 'between', label: 'is between' },
        { value: 'is_empty', label: 'is empty' },
        { value: 'is_not_empty', label: 'is not empty' }
      ]"
    />
    <el-input
      ref="inputRef"
      v-model="model"
      placeholder="Enter a value"
      :disabled="
        operator === 'is_empty' ||
        operator === 'is_not_empty'
      "
    ></el-input>
  </div>
</template>

<script>
export default {
  name: 'AppFilterTypeNumber'
}
</script>

<script setup>
import {
  computed,
  defineEmits,
  defineProps,
  watch,
  ref
} from 'vue'

const props = defineProps({
  value: {
    type: String,
    default: null
  },
  operator: {
    type: String,
    default: null
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:value',
  'update:operator'
])
const model = computed({
  get() {
    return props.value
  },
  set(v) {
    emit('update:value', v)
  }
})
const operator = computed({
  get() {
    return props.operator
  },
  set(v) {
    emit('update:operator', v)
  }
})
const expanded = computed(() => props.isExpanded)
const inputRef = ref(null)

watch(expanded, async (newValue) => {
  if (newValue) {
    inputRef.value.focus()
  }
})
</script>
