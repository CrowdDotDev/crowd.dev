<template>
  <div v-if="form">
    Date
    <!-- TODO: prepare date filter -->
  </div>
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, onMounted,
} from 'vue';
import { DateFilterValue, DateFilterOptions } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: DateFilterValue
} & DateFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: DateFilterValue)}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: DateFilterValue) => emit('update:modelValue', value),
});

const defaultForm: DateFilterValue = {
  operator: '',
  value: '',
  exclude: false,
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
  if (!form.value) {
    form.value = defaultForm;
  }
});
</script>

<script lang="ts">
export default {
  name: 'CrDateFilter',
};
</script>
