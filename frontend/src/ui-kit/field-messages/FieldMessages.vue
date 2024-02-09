<template>
  <cr-field-message v-for="error of errors.slice(0, 1)" :key="error.$property" v-bind="$attrs">
    {{ errorMessage(error) }}
    <template v-if="$slots.icon" #icon>
      <slot name="icon" />
    </template>
  </cr-field-message>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CrFieldMessage from '@/ui-kit/field-message/FieldMessage.vue';

const props = withDefaults(defineProps<{
  validation: any,
  errorMessages?: Record<string, string>
}>(), {
  errorMessages: () => ({}),
});

const errors = computed(() => props.validation?.$errors || []);

const errorMessage = (error) => {
  const prop = error.$validator;
  if (
    props.errorMessages
      && props.errorMessages[prop]
  ) {
    return props.errorMessages[prop];
  }
  if (!props.hideDefault) {
    return error.$message;
  }
  return '';
};
</script>

<script lang="ts">
export default {
  name: 'CrFieldMessages',
};
</script>
