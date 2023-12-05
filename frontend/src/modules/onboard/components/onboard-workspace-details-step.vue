<template>
  <app-form-item
    label="Workspace name"
    :required="true"
    :validation="$v.tenantName"
    :error-messages="{
      required: 'This field is required',
    }"
  >
    <el-input
      v-model="form.tenantName"
      type="text"
      @blur="$v.tenantName.$touch"
      @change="$v.tenantName.$touch"
    />
  </app-form-item>
</template>

<script setup lang="ts">
import AppFormItem from '@/shared/form/form-item.vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import { computed } from 'vue';

type Form = {
  tenantName: string
  invitedUsers: string
}

const emit = defineEmits<{(e: 'update:modelValue', value: Form): void}>();
const props = defineProps<{
  modelValue: Form,
}>();

const rules = {
  tenantName: {
    required,
  },
};

const form = computed<Form>({
  get() {
    return props.modelValue;
  },
  set(value: Form) {
    emit('update:modelValue', {
      ...props.modelValue,
      tenantName: value.tenantName,
    });
  },
});

const $v = useVuelidate(rules, form);

</script>
