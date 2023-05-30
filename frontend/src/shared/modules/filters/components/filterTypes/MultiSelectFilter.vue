<template>
  <div v-if="form">
    <cr-filter-include-switch v-if="!props.hideIncludeSwitch" v-model="form.include" />
    <div v-if="allOptions.length <= 70">
      <div class="max-h-58 overflow-auto py-3 px-2">
        <template v-for="(group, gi) of props.options" :key="gi">
          <div
            v-if="group.label && group.options.length > 0"
            class="text-2xs text-gray-400 font-semibold tracking-wide leading-6 uppercase px-3 my-1"
          >
            {{ group.label }}
          </div>
          <cr-filter-multi-select-option v-for="(option, oi) of group.options" :key="oi" v-model="form.value" :value="option.value">
            {{ option.label }}
          </cr-filter-multi-select-option>
        </template>
      </div>
    </div>
    <div v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  MultiSelectFilterValue,
  MultiSelectFilterOptions,
  MultiSelectFilterConfig,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import CrFilterIncludeSwitch from '@/shared/modules/filters/components/partials/FilterIncludeSwitch.vue';
import CrFilterMultiSelectOption
  from '@/shared/modules/filters/components/partials/multiselect/FilterMultiSelectOption.vue';

const props = defineProps<{
  modelValue: MultiSelectFilterValue,
  config: MultiSelectFilterConfig
} & MultiSelectFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: MultiSelectFilterValue): void}>();

const allOptions = computed(() => props.options.map((g) => g.options).flat());

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
