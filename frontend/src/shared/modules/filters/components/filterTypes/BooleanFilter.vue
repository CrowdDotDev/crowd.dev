<template>
  <div v-if="form" class="filter-base-boolean pb-4">
    <cr-filter-include-switch v-if="!props.hideIncludeSwitch" v-model="form.include" class="mb-3" />
    <p class="text-gray-500 mb-2 font-medium text-2xs pb-1">
      {{ props.config.label }}
    </p>
    <cr-filter-select-option v-model="form.value" :value="true">
      True
    </cr-filter-select-option>
    <cr-filter-select-option v-model="form.value" :value="false">
      False
    </cr-filter-select-option>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  BooleanFilterValue,
  BooleanFilterOptions,
  BooleanFilterConfig,
} from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import CrFilterIncludeSwitch from '@/shared/modules/filters/components/partials/FilterIncludeSwitch.vue';
import CrFilterSelectOption from '@/shared/modules/filters/components/partials/select/FilterSelectOption.vue';

const props = defineProps<{
  modelValue: BooleanFilterValue,
  config: BooleanFilterConfig,
} & BooleanFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: BooleanFilterValue): void}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: BooleanFilterValue) => emit('update:modelValue', value),
});

const defaultForm: BooleanFilterValue = {
  value: true,
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
  name: 'CrBooleanFilter',
};
</script>
