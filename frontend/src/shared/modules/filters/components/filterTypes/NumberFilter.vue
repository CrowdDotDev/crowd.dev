<template>
  <div v-if="form">
    <el-input v-model="form.value" type="text" placeholder="Pick number" />
  </div>
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, onMounted,
} from 'vue';
import { NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';

const props = defineProps<{
  modelValue: NumberFilterValue
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: NumberFilterValue)}>();

const form = computed<NumberFilterValue>({
  get: () => props.modelValue,
  set: (value: NumberFilterValue) => emit('update:modelValue', value),
});

const defaultForm: NumberFilterValue = {
  value: '',
  operator: 'eq',
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

const $v = useVuelidate(rules, form);

onMounted(() => {
  if (!form.value) {
    form.value = defaultForm;
  }
});
</script>

<script lang="ts">
export default {
  name: 'CrNumberFilter',
};
</script>
