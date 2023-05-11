<template>
  <div v-if="form">
    Select filter
    <!-- TODO: prepare select filter -->
  </div>
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, onMounted,
} from 'vue';
import { SelectFilterValue } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: SelectFilterValue
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: SelectFilterValue)}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: SelectFilterValue) => emit('update:modelValue', value),
});

const defaultForm: SelectFilterValue = {
  value: '',
  exclude: false,
};

const rules: any = {
  value: {
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
  name: 'CrSelectFilter',
};
</script>
