<template>
  <div v-if="form">
    <cr-filter-include-switch v-if="!props.hideIncludeSwitch" v-model="form.include" />

    <cr-filter-inline-select
      v-model="form.operator"
      prefix="Text:"
      class="mb-2"
      :options="stringFilterOperators"
    />

    <cr-filter-input
      v-model="form.value"
      class="mb-1"
      placeholder="Enter a value"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import {
  FilterStringOperator,
  StringFilterConfig,
  StringFilterOptions,
  StringFilterValue,
} from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import CrFilterIncludeSwitch from '@/shared/modules/filters/components/partials/FilterIncludeSwitch.vue';
import CrFilterInlineSelect from '@/shared/modules/filters/components/partials/FilterInlineSelect.vue';
import CrFilterInput from '@/shared/modules/filters/components/partials/string/FilterInput.vue';
import { stringFilterOperators } from '@/shared/modules/filters/config/constants/string.constants';

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
  operator: FilterStringOperator.LIKE,
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
