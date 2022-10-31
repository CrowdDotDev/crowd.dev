<template>
  <div class="filter-type-select px-2 pb-4 pt-2">
    <div class="text-gray-600 mb-2">Boolean is</div>
    <div
      class="filter-type-select-option"
      :class="model === true ? 'is-selected' : ''"
      @click="handleOptionClick(true)"
    >
      True
      <i
        v-if="model === true"
        class="ri-check-line text-brand-600 absolute right-0 mr-4"
      ></i>
    </div>
    <div
      class="filter-type-select-option"
      :class="model === false ? 'is-selected' : ''"
      @click="handleOptionClick(false)"
    >
      False
      <i
        v-if="model === false"
        class="ri-check-line text-brand-600 absolute right-0 mr-4"
      ></i>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppFilterTypeBoolean'
}
</script>

<script setup>
import { defineEmits, defineProps, computed } from 'vue'

const props = defineProps({
  value: {
    type: String,
    default: null
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:value'])
const model = computed({
  get() {
    return props.value
  },
  set(v) {
    emit('update:value', v)
  }
})

const handleOptionClick = (value) => {
  model.value = value
}
</script>
