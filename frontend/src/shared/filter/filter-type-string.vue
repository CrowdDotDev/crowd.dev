<template>
  <div class="filter-type-string">
    <app-inline-select-input
      v-model="operator"
      popper-placement="bottom-start"
      prefix="Text:"
      class="mb-2"
      :options="[
        { value: 'contains', label: 'contains' },
        {
          value: 'not_contains',
          label: 'does not contain'
        },
        { value: 'is', label: 'is' },
        { value: 'starts_with', label: 'starts with' },
        { value: 'ends_with', label: 'ends with' },
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

<style lang="scss">
.filter-type-string {
  @apply px-2 pb-4 pt-3;

  .el-input__wrapper,
  .el-input__wrapper.is-focus,
  .el-input__wrapper:hover {
    @apply h-8 bg-gray-50 shadow-none border-none rounded-md;

    input {
      &,
      &:hover,
      &:focus {
        @apply bg-gray-50 shadow-none border-none outline-none h-full min-h-8;
      }
    }
  }
}
</style>
