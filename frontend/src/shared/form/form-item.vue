<template>
  <div
    class="el-form-item"
    :class="{
      'is-error': errors.length,
    }"
    v-bind="$attrs"
  >
    <div class="el-form-item__content flex-col items-start">
      <label
        v-if="label"
        :for="formId"
        class="text-xs mb-1 font-medium leading-5 block text-gray-900"
      >{{ label }}
        <span
          v-if="required"
          class="text-brand-500"
        >*</span></label>

      <div class="w-full">
        <slot />
      </div>
      <div
        v-if="showError && errors.length > 0"
        class="el-form-item__error"
      >
        <div class="error-msg">
          {{ errorMessage(errors[0]) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  validation: {
    required: false,
    type: Object,
    default: () => ({}),
  },
  label: {
    required: false,
    type: String,
    default: '',
  },
  formId: {
    required: false,
    type: String,
    default: '',
  },
  required: {
    required: false,
    type: Boolean,
    default: false,
  },
  errorMessages: {
    required: false,
    type: Object,
    default: () => ({}),
  },
  showError: {
    required: false,
    type: Boolean,
    default: true,
  },
});

const errors = computed(() => props.validation?.$errors || []);

const errorMessage = (error) => {
  if (
    props.errorMessages
    && props.errorMessages[error.$validator]
  ) {
    return props.errorMessages[error.$validator];
  }
  return error.$message;
};
</script>

<script>
export default {
  name: 'AppFormItem',
};
</script>
