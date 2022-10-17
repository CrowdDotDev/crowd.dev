<template>
  <div
    class="filter-type-number filter-with-operator-and-input"
  >
    <app-inline-select-input
      v-model="operator"
      popper-placement="bottom-start"
      prefix="Number:"
      class="mb-2"
      :options="computedOperatorOptions"
    />
    <el-input
      ref="inputRef"
      v-model="model"
      type="number"
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
import filterOperators from '@/shared/filter/filter-operators'

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
    emit('update:value', Number(v))
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
const computedOperatorOptions = computed(() => {
  return Object.keys(filterOperators.number.operator).map(
    (o) => {
      return {
        value: o,
        label: filterOperators.number.operator[o]
      }
    }
  )
})
const expanded = computed(() => props.isExpanded)
const inputRef = ref(null)

watch(expanded, async (newValue) => {
  if (newValue) {
    inputRef.value.focus()
  }
})
</script>

<style lang="scss">
.filter-type-number {
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}
</style>
