<template>
  <div class="filter-type-string">
    <el-input ref="inputRef" v-model="model"></el-input>
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
  modelValue: {
    type: String,
    default: null
  },
  isExpanded: {
    type: Boolean,
    default: false
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
const inputRef = ref(null)

watch(expanded, async (newValue) => {
  if (newValue) {
    inputRef.value.focus()
  }
})
</script>
