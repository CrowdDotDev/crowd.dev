<template>
  <div v-if="form">
    String filter
  </div>
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, onMounted,
} from 'vue';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { StringFilterOptions, StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';

const props = defineProps<{
  modelValue: StringFilterValue
} & StringFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: StringFilterValue)}>();

const form = computed<StringFilterValue>({
  get: () => props.modelValue,
  set: (value: StringFilterValue) => emit('update:modelValue', value),
});

const defaultForm: StringFilterValue = {
  value: '',
  operator: 'eq',
  include: true,
};

const rules: any = {
  value: {
    required,
  },
  operator: {
    required,
  },
};

useVuelidate(rules, form);

onMounted(() => {
  if (!form.value || Object.keys(form.value).length === 0) {
    form.value = defaultForm;
  }
});
</script>

<script lang="ts">
export default {
  name: 'CrStringFilter',
};
</script>
