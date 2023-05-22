<template>
  <div v-if="form">
    Number Filter
    <el-input v-model="form.value" type="number" placeholder="Pick number" />
  </div>
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, onMounted,
} from 'vue';
import { NumberFilterOptions, NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';

const props = defineProps<{
  modelValue: NumberFilterValue
} & NumberFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: NumberFilterValue)}>();

const form = computed<NumberFilterValue>({
  get: () => props.modelValue,
  set: (value: NumberFilterValue) => emit('update:modelValue', value),
});

const defaultForm: NumberFilterValue = {
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
  name: 'CrNumberFilter',
};
</script>
