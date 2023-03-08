<template>
  <div
    class="el-form-item"
    :class="{
      'is-error': props.validation?.$errors?.length
    }"
  >
    <div class="el-form-item__content flex-col items-start">
      <label
        v-if="label"
        class="text-xs mb-1 font-medium leading-5 block text-gray-900"
        >{{ label }}
        <span v-if="required" class="text-brand-500"
          >*</span
        ></label
      >

      <div class="w-full">
        <slot />
      </div>
      <div v-if="showError">
        <transition-group name="el-zoom-in-top">
          <div
            v-for="error of props.validation?.$errors || []"
            :key="error.$uid"
            class="el-form-item__error"
          >
            <div class="error-msg">
              {{ errorMessage(error) }}
            </div>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppFormItem'
}
</script>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  validation: {
    required: false,
    type: Object,
    default: () => ({})
  },
  label: {
    required: false,
    type: String,
    default: ''
  },
  required: {
    required: false,
    type: Boolean,
    default: false
  },
  errorMessages: {
    required: false,
    type: Object,
    default: () => ({})
  },
  showError: {
    required: false,
    type: Boolean,
    default: true
  }
})

const errorMessage = (error) => {
  if (
    props.errorMessages &&
    props.errorMessages[error.$validator]
  ) {
    return props.errorMessages[error.$validator]
  }
  return error.$message
}
</script>
