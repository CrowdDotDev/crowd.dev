<template>
  <div
    v-if="errors.length > 0"
    class="el-form-item__error"
    :class="errorClass"
  >
    <div class="error-msg">
      <i :class="errorIcon" class="mr-1 text-base" />{{ errorMessage(errors[0]) }}
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
  errorMessages: {
    required: false,
    type: Object,
    default: () => ({}),
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

const errorMessage = (error) => {
  const prop = `${error.$property}-${error.$validator}`;
  if (
    props.errorMessages
    && props.errorMessages[prop]
  ) {
    return props.errorMessages[prop];
  }
  return error.$message;
};
</script>

<script>
export default {
  name: 'AppFormErrors',
};
</script>
