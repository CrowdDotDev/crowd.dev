<template>
  <article class="pb-3 flex items-center">
    <div class="flex flex-grow items-start">
      <app-form-item
        :validation="$v"
        :error-messages="{
          required: 'This field is required',
          notEmail: 'This field shouldn\'t be an email. It should be a group name.',
        }"
        class="mb-0 mr-2 no-margin flex-grow is-error-relative"
      >
        <el-input v-model="model" :placeholder="placeholder" :disabled="disabled" @blur="$v.$touch" />
      </app-form-item>
    </div>
    <slot name="after" />
  </article>
</template>

<script setup>
import {
  computed,
} from 'vue';
import { required, helpers } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import AppFormItem from '@/shared/form/form-item.vue';

const emit = defineEmits(['update:modelValue', 'update:boundValue']);
const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: null,
  },
  validationFunction: {
    type: Function, // Validation function that returns a boolean
    default: null,
  },
  bindValue: {
    type: Boolean, // Whether to bind another value to the function output
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const notEmail = (value) => !value.includes('@');

const rules = computed(() => {
  if (props.disabled) {
    return {};
  }

  return {
    required,
    notEmail,
    customValidation: helpers.withMessage(
      "This is not a valid group or you don't have access to it",
      helpers.withAsync(props.validationFunction),
    ),
  };
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
const $v = useVuelidate(rules, model);
</script>

<script>
export default {
  name: 'AppArrayInputWithCustomValidation',
};
</script>
