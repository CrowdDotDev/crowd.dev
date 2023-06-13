<template>
  <div
    class="el-form-item"
    :class="{
      'is-error': enabledError(errors),
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
        :class="errorClass"
      >
        <div class="error-msg">
          <i :class="errorIcon" class="mr-1 text-base" />{{ errorMessage(errors[0]) }}
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
  filterErrors: {
    required: false,
    type: Array,
    default: () => null,
  },
  showError: {
    required: false,
    type: Boolean,
    default: true,
  },
  errorIcon: {
    required: false,
    type: String,
    default: '',
  },
  errorClass: {
    required: false,
    type: String,
    default: '',
  },
});

const errors = computed(() => props.validation?.$errors || []);

const enabledError = (errors) => {
  if (props.filterErrors && props.filterErrors.length > 0 && errors.length > 0) {
    return props.filterErrors.includes(errors[0].$validator);
  }
  return errors.length > 0;
};

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
