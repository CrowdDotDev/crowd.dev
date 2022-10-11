<template>
  <div class="filter-type-select filter-content-wrapper">
    <el-dropdown-item
      v-for="option of computedOptions"
      :key="option.name"
      :class="options.selected ? 'is-selected' : ''"
      @click.prevent="handleOptionClick(option)"
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
    </el-dropdown-item>
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
  modelValue: {
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
const emit = defineEmits(['update:modelValue'])
const computedOptions = computed(() => {
  return props.options.map((o) => {
    return {
      ...o,
      selected: model.value.some((i) => i.value === o.value)
    }
  })
})
const model = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const handleOptionClick = (option) => {
  if (
    !props.modelValue.some(
      (item) => item.name === option.name
    ) &&
    props.multiple
  ) {
    model.value.push(option)
  } else if (props.multiple) {
    const index = model.value.findIndex(
      (o) => o.name === option.name
    )
    model.value.splice(index, 1)
  } else {
    model.value = [option]
  }
}
</script>
