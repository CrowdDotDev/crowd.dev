<template>
  <article>
    <app-form-item
      :validation="$v"
      :error-messages="{
        email: 'Invalid email',
      }"
      class="mb-0"
      error-class="relative top-0"
    >
      <div class="flex flex-grow gap-2 last:pb-0">
        <el-input
          v-model="model"
          placeholder="Enter email address"
          @change="$v.$touch()"
          @blur="$v.$touch()"
        />
        <slot name="actions" />
      </div>
    </app-form-item>
  </article>
</template>

<script setup>
import {
  computed,
} from 'vue';
import useVuelidate from '@vuelidate/core';
import { email } from '@vuelidate/validators';
import AppFormItem from '@/shared/form/form-item.vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(contact) {
    emit('update:modelValue', contact);
  },
});

const rules = {
  email,
};

const $v = useVuelidate(rules, model);
</script>

<script>
export default {
  name: 'AppMemberFormEmailsItem',
};
</script>
