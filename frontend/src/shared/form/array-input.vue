<template>
  <article class="pb-3 flex items-center">
    <div class="flex flex-grow items-start">
      <app-form-item
        :validation="$v"
        :error-messages="{
          required: 'This field is required',
        }"
        class="mb-0 mr-2 no-margin flex-grow is-error-relative"
      >
        <el-input
          v-model="model"
          :placeholder="placeholder"
          @blur="$v.$touch"
          @change="$v.$touch"
        />
      </app-form-item>
    </div>
    <slot name="after" />
  </article>
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import AppFormItem from '@/shared/form/form-item.vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: null,
  },
});

const rules = {
  required,
};

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
  name: 'AppEagleEyeSettingsInclude',
};
</script>
