<template>
  <div v-if="form">
    <div class="p-4 pb-5">
      <cr-filter-inline-select
        v-model="form.operator"
        :prefix="`${props.config.label}:`"
        class="mb-3"
        :options="stringFilterOperators"
      />

      <cr-filter-input
        v-model="form.value"
        placeholder="Enter a value"
        data-qa="filter-input"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import {
  StringFilterConfig,
  StringFilterOptions,
  StringFilterValue,
} from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import CrFilterInlineSelect from '@/shared/modules/filters/components/partials/FilterInlineSelect.vue';
import CrFilterInput from '@/shared/modules/filters/components/partials/string/FilterInput.vue';
import { stringFilterOperators, FilterStringOperator } from '@/shared/modules/filters/config/constants/string.constants';

const props = defineProps<{
  modelValue: StringFilterValue,
  config: StringFilterConfig
} & StringFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: StringFilterValue): void}>();

const form = computed<StringFilterValue>({
  get: () => props.modelValue,
  set: (value: StringFilterValue) => emit('update:modelValue', value),
});

const defaultForm: StringFilterValue = {
  value: '',
  include: true,
  operator: FilterStringOperator.LIKE,
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
  form.value = {
    ...defaultForm,
    ...form.value,
  };
});
</script>

<script lang="ts">
export default {
  name: 'CrStringFilter',
};
</script>
