<template>
  <div class="filter-type-select">
    <el-dropdown-item
      v-for="option of options"
      :key="option.name"
      :class="
        modelValue.some((item) => item.name === option.name)
          ? 'is-selected'
          : ''
      "
      @click.prevent="handleOptionClick(option)"
    >
      <div class="flex items-center justify-between h-4">
        <div class="flex items-center">
          <el-checkbox
            v-if="multiple"
            :model-value="
              modelValue.some(
                (item) => item.name === option.name
              )
            "
            class="filter-checkbox"
          />
          {{ option.label }}
        </div>
        <i
          v-if="
            !multiple &&
            modelValue.some(
              (item) => item.name === option.name
            )
          "
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
  multiple: {
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
