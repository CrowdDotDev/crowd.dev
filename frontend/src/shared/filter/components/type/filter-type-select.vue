<template>
  <div class="filter-type-select filter-content-wrapper">
    <div
      v-for="option of computedOptions"
      :key="option.name"
      class="filter-type-select-option"
      :class="option.selected ? 'is-selected' : ''"
      @click="handleOptionClick(option)"
    >
      <div class="flex items-center justify-between h-4">
        <div class="flex items-center">
          {{ option.label }}
        </div>
        <i
          v-if="option.selected"
          class="ri-check-line text-brand-600 absolute right-0 mr-4"
        ></i>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppFilterTypeSelect'
}
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    default: () => []
  },
  value: {
    type: String,
    default: () => ''
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:value'])
const computedOptions = computed(() => {
  return props.options.map((o) => {
    return {
      ...o,
      selected: model.value === o.value
    }
  })
})
const model = computed({
  get() {
    return props.value
  },
  set(v) {
    emit('update:value', v)
  }
})

const handleOptionClick = (option) => {
  model.value = option.value
}
</script>

<style lang="scss">
.filter-type-select {
  &-option {
    @apply flex items-center text-black px-4 py-3 text-xs cursor-pointer relative;
    border-radius: 4px;

    &:not(:last-of-type) {
      @apply mb-1;
    }

    i {
      @apply mr-2;
    }

    i:not(.ri-delete-bin-line) {
      @apply text-gray-400;
    }

    &:focus,
    &:not(.is-disabled):hover,
    &:not(.is-disabled):focus {
      @apply text-black bg-gray-50;
    }

    &.is-disabled {
      @apply cursor-not-allowed;
    }

    &.is-selected,
    &:focus.is-selected {
      @apply relative bg-brand-50;
      i {
        @apply mr-3 text-brand-600;
      }
    }
  }
}
</style>
