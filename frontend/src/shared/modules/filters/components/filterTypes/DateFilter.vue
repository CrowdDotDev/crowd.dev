<template>
  <div v-if="form">
    Date filter
    <!-- TODO: prepare date filter -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  DateFilterValue,
  DateFilterOptions,
  DateFilterConfig,
} from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: DateFilterValue,
  config: DateFilterConfig
} & DateFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: DateFilterValue): void}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: DateFilterValue) => emit('update:modelValue', value),
});

const defaultForm: DateFilterValue = {
  operator: '',
  value: '',
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
  name: 'CrDateFilter',
};
</script>
