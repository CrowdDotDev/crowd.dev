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
          <el-checkbox
            v-if="multiple"
            :model-value="option.selected"
            class="filter-checkbox"
          />
          {{ option.label }}
        </div>
        <i
          v-if="!multiple && option.selected"
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
    type: Array,
    default: () => []
  },
  isExpanded: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:value'])
const computedOptions = computed(() => {
  return props.options.map((o) => {
    return {
      ...o,
      selected: model.value.some((i) =>
        valuesEqual(o.value, i.value)
      )
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
  if (
    !props.value.some((item) =>
      valuesEqual(item.value, option.value)
    ) &&
    props.multiple
  ) {
    model.value.push(option)
  } else if (props.multiple) {
    const index = model.value.findIndex((o) =>
      valuesEqual(o.value, option.value)
    )
    model.value.splice(index, 1)
  } else {
    model.value = [option]
  }
}

const valuesEqual = (valueA, valueB) => {
  if (Array.isArray(valueA)) {
    return (
      valueA[0] === valueB[0] && valueA[1] === valueB[1]
    )
  } else {
    return valueA === valueB
  }
}
</script>

<style lang="scss">
.filter-type-select {
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
