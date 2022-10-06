<template>
  <div class="filter-type-select">
    <app-number-range-input v-model="model" />
  </div>
</template>

<script>
export default {
  name: 'AppFilterTypeRange'
}
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
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
</script>
