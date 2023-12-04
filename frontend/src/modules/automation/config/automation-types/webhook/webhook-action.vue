<template>
  <div>
    <app-form-item
      class="pb-4"
      label="Webhook URL"
      :required="true"
      :validation="$v.url"
      :error-messages="{
        required: 'This field is required',
        url: 'This is not a valid url',
      }"
    >
      <el-input
        v-model="form.url"
        type="url"
        placholder="https://somewebhook.url"
        @blur="$v.url.$touch"
        @change="$v.url.$touch"
      />
    </app-form-item>
  </div>
</template>

<script setup>
import {
  computed, defineEmits, defineProps, onMounted,
} from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { required, url } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const defaultValue = {
  url: '',
};

const form = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const rules = {
  url: {
    required,
    url,
  },
};

const $v = useVuelidate(rules, form);

onMounted(() => {
  if (Object.keys(props.modelValue).length === 0) {
    emit('update:modelValue', defaultValue);
  }
});

</script>

<script>
export default {
  name: 'AppAutomationWebhookAction',
};
</script>
