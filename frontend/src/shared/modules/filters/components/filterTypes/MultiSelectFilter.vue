<template>
  <div v-if="form">
    Multi select
    <!-- TODO: prepare multi select filter -->
  </div>
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, onMounted,
} from 'vue';
import {
  MultiSelectFilterValue,
  MultiSelectFilterOptions, MultiSelectFilterConfig,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: MultiSelectFilterValue,
  config: MultiSelectFilterConfig
} & MultiSelectFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: MultiSelectFilterValue)}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: MultiSelectFilterValue) => emit('update:modelValue', value),
});

const defaultForm: MultiSelectFilterValue = {
  value: [],
  include: true,
};

const rules: any = {
  value: {
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
  name: 'CrMultiSelectFilter',
};
</script>
