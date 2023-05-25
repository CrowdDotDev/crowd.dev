<template>
  <div v-if="form" class="filter-base-select">
    <cr-filter-include-switch v-if="!props.hideIncludeSwitch" v-model="form.include" />
    <div class="max-h-58 overflow-auto pt-2 pb-3">
      <template v-for="(group, gi) of props.options" :key="gi">
        <div
          v-if="group.label"
          class="text-2xs text-gray-400 font-semibold tracking-wide leading-6 uppercase px-3 my-1"
        >
          {{ group.label }}
        </div>
        <cr-filter-select-option v-for="(option, oi) of group.options" :key="oi" v-model="form.value" :value="option.value">
          {{ option.label }}
        </cr-filter-select-option>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, onMounted,
} from 'vue';
import {
  SelectFilterConfig,
  SelectFilterOptions,
  SelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import CrFilterIncludeSwitch from '@/shared/modules/filters/components/partials/FilterIncludeSwitch.vue';
import CrFilterSelectOption from '@/shared/modules/filters/components/partials/select/FilterSelectOption.vue';

const props = defineProps<{
  modelValue: SelectFilterValue,
  config: SelectFilterConfig
} & SelectFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: SelectFilterValue)}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: SelectFilterValue) => emit('update:modelValue', value),
});

const defaultForm: SelectFilterValue = {
  value: '',
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
  name: 'CrSelectFilter',
};
</script>
