<template>
  <div class="filter-with-operator-and-input">
    <app-inline-select-input
      v-model="operator"
      popper-placement="bottom-start"
      prefix="Text:"
      class="mb-2"
      :options="computedOperatorOptions"
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
  name: 'AppFilterTypeString'
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
import filterOperators from './filter-operators'

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
const computedOperatorOptions = computed(() => {
  return Object.keys(filterOperators.string.operator).map(
    (o) => {
      return {
        value: o,
        label: filterOperators.string.operator[o]
      }
    }
  )
})
const inputRef = ref(null)

watch(expanded, async (newValue) => {
  if (newValue) {
    inputRef.value.focus()
  }
})
</script>
