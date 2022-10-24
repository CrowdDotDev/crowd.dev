<template>
  <div
    class="flex items-center justify-between -mx-6 px-6 py-4 bg-gray-100 border-t border-b border-gray-200"
  >
    <div>
      <span class="block text-gray-900 font-medium text-sm"
        >Activate public page</span
      >
      <span class="text-gray-500 text-2xs"
        >Lorem ipsum dolor sit amet</span
      >
    </div>
    <div>
      <el-switch
        v-model="model"
        style="
          --el-switch-on-color: #22c55e;
          --el-switch-off-color: #cbd5e1;
        "
      />
    </div>
  </div>
</template>

<script setup>
import { defineEmits, defineProps, computed } from 'vue'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const model = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})
</script>
