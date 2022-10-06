<template>
  <div class="filter-type-select">
    <app-keywords-input
      v-model="model"
      placeholder="Enter keywords..."
    />
  </div>
</template>

<script>
export default {
  name: 'AppFilterTypeKeywords'
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
