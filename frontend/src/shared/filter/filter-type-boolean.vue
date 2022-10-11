<template>
  <div class="filter-type-boolean px-2 pb-4 pt-2">
    <div class="text-gray-600 mb-2">Boolean is</div>
    <div
      class="filter-type-boolean-option"
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
      class="filter-type-boolean-option"
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

<style lang="scss">
.filter-type-boolean {
  &-option {
    @apply flex items-center text-black px-4 py-3 text-xs cursor-pointer;
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

    &.is-selected,
    &:focus.is-selected {
      background-color: #fff5f4;
      @apply relative;
      i {
        @apply mr-3 text-brand-600;
      }
      &:hover {
        @apply bg-brand-50;
      }
    }
  }
}
</style>
