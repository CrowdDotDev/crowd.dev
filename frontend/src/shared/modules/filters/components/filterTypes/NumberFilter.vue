<template>
  <div v-if="form">
    <cr-filter-include-switch v-if="!props.hideIncludeSwitch" v-model="form.include" />

    <div class="p-4 pb-5">
      <cr-filter-inline-select
        v-model="form.operator"
        :prefix="`${props.config.label}:`"
        class="mb-3"
        :options="numberFilterOperators"
      />
      <div class="flex -mx-1">
        <div class="flex-grow px-1">
          <app-form-item
            :validation="$v.value"
            class="mb-0"
            :show-error="false"
          >
            <cr-filter-input
              v-model="form.value"
              type="number"
              min="0"
              :placeholder="form.operator !== FilterNumberOperator.BETWEEN ? 'Enter value' : 'From'"
              @blur="$v.value.$touch"
              @change="$v.value.$touch"
            />
          </app-form-item>
        </div>
        <div v-if="form.operator === FilterNumberOperator.BETWEEN" class="flex-grow px-1">
          <app-form-item
            :validation="$v.valueTo"
            class="mb-0"
            :show-error="false"
          >
            <cr-filter-input
              v-model="form.valueTo"
              type="number"
              placeholder="To"
              min="0"
              @blur="$v.valueTo.$touch"
              @change="$v.valueTo.$touch"
            />
          </app-form-item>
        </div>
      </div>
      <app-form-errors
        :validation="$v"
        error-icon="ri-error-warning-line"
        error-class="relative top-1"
        :error-messages="{
          'value-required': `${form.operator === FilterNumberOperator.BETWEEN ? 'From field' : 'This field'} is required`,
          'value-numeric': `${form.operator === FilterNumberOperator.BETWEEN ? 'From field' : 'This field'} is invalid`,
          'value-minValue': `${form.operator === FilterNumberOperator.BETWEEN ? 'From field' : 'This field'} value has to be positive`,
          'valueTo-required': `To field is required`,
          'valueTo-numeric': `To field is invalid`,
          'valueTo-minValue': `Number should be higher than “From” field`,
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import {
  NumberFilterConfig,
  NumberFilterOptions,
  NumberFilterValue,
} from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import useVuelidate from '@vuelidate/core';
import { minValue, numeric, required } from '@vuelidate/validators';
import CrFilterIncludeSwitch from '@/shared/modules/filters/components/partials/FilterIncludeSwitch.vue';
import {
  FilterNumberOperator,
  numberFilterOperators,
} from '@/shared/modules/filters/config/constants/number.constants';
import CrFilterInput from '@/shared/modules/filters/components/partials/string/FilterInput.vue';
import CrFilterInlineSelect from '@/shared/modules/filters/components/partials/FilterInlineSelect.vue';
import AppFormItem from '@/shared/form/form-item.vue';
import AppFormErrors from '@/shared/form/form-errors.vue';

const props = defineProps<{
  modelValue: NumberFilterValue,
  config: NumberFilterConfig
} & NumberFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: NumberFilterValue): void}>();

const form = computed<NumberFilterValue>({
  get: () => props.modelValue,
  set: (value: NumberFilterValue) => emit('update:modelValue', value),
});

const defaultForm: NumberFilterValue = {
  value: '',
  valueTo: '',
  operator: FilterNumberOperator.EQ,
  include: true,
};

const rules: any = computed(() => ({
  value: {
    required,
    numeric,
    minValue: minValue(0),
  },
  ...(form.value.operator === FilterNumberOperator.BETWEEN ? {
    valueTo: {
      required,
      numeric,
      minValue: minValue((form.value.value) || 0),
    },
  } : {}),
  operator: {
    required,
  },
}));

const $v = useVuelidate(rules, form);

watch(() => form.value.operator, (operator) => {
  console.log(operator);
  if (operator !== FilterNumberOperator.BETWEEN) {
    form.value.valueTo = undefined;
  } else {
    form.value.valueTo = '';
  }
});

onMounted(() => {
  if (!form.value || Object.keys(form.value).length < 3>) {
    form.value = defaultForm;
  }
});
</script>

<script lang="ts">
export default {
  name: 'CrNumberFilter',
};
</script>
