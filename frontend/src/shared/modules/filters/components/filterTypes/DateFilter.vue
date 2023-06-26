<template>
  <div v-if="form">
    <div class="p-4 pb-5">
      <cr-filter-inline-select
        v-model="form.operator"
        :prefix="`${props.config.label}:`"
        class="mb-3"
        :options="operators"
      />
      <div class="filter-date-field" data-qa="filter-date-input">
        <el-date-picker
          v-model="form.value"
          :placeholder="isBetween ? 'Select date range' : 'Select date'"
          :value-format="props.dateFormat ?? 'YYYY-MM-DD'"
          :format="props.dateFormat ?? 'YYYY-MM-DD'"
          popper-class="date-picker-popper"
          v-bind="betweenProps"
          :teleported="false"
          @blur="$v.value.$touch"
          @change="$v.value.$touch"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import {
  DateFilterConfig,
  DateFilterOptions,
  DateFilterValue,
} from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import { dateFilterOperators, FilterDateOperator } from '@/shared/modules/filters/config/constants/date.constants';
import CrFilterInlineSelect from '@/shared/modules/filters/components/partials/FilterInlineSelect.vue';

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
  operator: FilterDateOperator.EQ,
  value: '',
};

const rules: any = {
  value: {
    required,
  },
  operator: {
    required,
  },
};

const checkIfBetween = (operator) => [FilterDateOperator.BETWEEN, FilterDateOperator.NOT_BETWEEN].includes(operator);

const isBetween = computed(() => checkIfBetween(form.value.operator));

const operators = computed(() => {
  if (props.datepickerType === 'year') {
    return dateFilterOperators.filter((o) => !checkIfBetween(o.value));
  }
  return dateFilterOperators;
});

const $v = useVuelidate(rules, form);

const betweenProps = computed(() => (!isBetween.value
  ? {
    type: props.datepickerType ?? 'date',
  }
  : {
    type: props.datepickerType === 'month' ? 'monthrange' : 'daterange',
    'range-separator': 'To',
    'start-placeholder': 'Start date',
    'end-placeholder': 'End date',
  }));

watch(() => form.value.operator, (operator, previousOperator) => {
  const isPreviousBetweenOperator = checkIfBetween(previousOperator);
  const isCurrentBetweenOperator = checkIfBetween(operator);
  if (isCurrentBetweenOperator !== isPreviousBetweenOperator) {
    form.value.value = '';
  }
});

onMounted(() => {
  form.value = {
    ...defaultForm,
    ...form.value,
  };
});
</script>

<script lang="ts">
export default {
  name: 'CrDateFilter',
};
</script>

<style lang="scss">
.filter-date-field {
  .el-input__wrapper,
  .el-input__wrapper.is-focus,
  .el-input__wrapper:hover {
    @apply bg-gray-50 shadow-none rounded-md border border-gray-50 transition w-full #{!important};

    input {
      &,
      &:hover,
      &:focus {
        border: none !important;
        @apply bg-gray-50 shadow-none outline-none h-full min-h-8;
      }
    }
  }
}

.el-form-item.is-error {
  .filter-date-field {
    .el-input__wrapper,
    .el-input__wrapper.is-focus,
    .el-input__wrapper:hover{
      border-color: var(--el-color-danger) !important;
    }
  }
}
</style>
