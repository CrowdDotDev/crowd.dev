<template>
  <div class="filter-type-select filter-content-wrapper">
    <div
      v-for="option of computedOptions"
      :key="option.name"
      class="filter-type-select-option"
      :class="`${option.selected ? 'is-selected' : ''} ${
        option.soon ? 'is-disabled' : ''
      }`"
      @click="handleOptionClick(option)"
    >
      <div class="flex items-center justify-between h-4">
        <div class="flex items-center">
          <el-checkbox
            v-model="option.selected"
            class="filter-checkbox"
            :disabled="option.soon"
            @change="handleOptionClick(option)"
          />
          <slot name="optionPrefix" :item="option"></slot>
          {{ option.label }}
          <span
            v-if="option.soon"
            class="absolute right-0 inset-y-0 text-gray-400 italic text-xs flex items-center"
            >Soon</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppFilterTypeSelectMulti'
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
  if (option.soon) {
    return
  }

  if (
    !props.value.some((item) =>
      valuesEqual(item.value, option.value)
    )
  ) {
    model.value.push(option)
  } else {
    const index = model.value.findIndex((o) =>
      valuesEqual(o.value, option.value)
    )
    model.value.splice(index, 1)
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
