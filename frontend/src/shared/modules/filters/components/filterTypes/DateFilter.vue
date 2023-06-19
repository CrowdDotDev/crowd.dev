<template>
  <div v-if="form">
    <cr-filter-include-switch v-if="!props.hideIncludeSwitch" v-model="form.include" />
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
          :placeholder="form.operator === FilterDateOperator.BETWEEN ? 'Select date range' : 'Select date'"
          :value-format="props.dateFormat ?? 'YYYY-MM-DD'"
          :format="props.dateFormat ?? 'YYYY-MM-DD'"
          popper-class="date-picker-popper"
          v-bind="betweenProps"
          :teleported="false"
          :type="datepickerType ?? 'date'"
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
  DateFilterValue,
  DateFilterOptions,
  DateFilterConfig,
} from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import CrFilterIncludeSwitch from '@/shared/modules/filters/components/partials/FilterIncludeSwitch.vue';
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

const operators = computed(() => {
  if (props.datepickerType === 'year') {
    return dateFilterOperators.filter((o) => o.value !== FilterDateOperator.BETWEEN);
  }
  return dateFilterOperators;
});

const $v = useVuelidate(rules, form);

const betweenProps = computed(() => (form.value.operator !== FilterDateOperator.BETWEEN
  ? {}
  : {
    type: props.datepickerType === 'month' ? 'monthrange' : 'daterange',
    'range-separator': 'To',
    'start-placeholder': 'Start date',
    'end-placeholder': 'End date',
  }));

watch(() => form.value.operator, (operator, previousOperator) => {
  if ([operator, previousOperator].includes(FilterDateOperator.BETWEEN) && operator !== previousOperator) {
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
