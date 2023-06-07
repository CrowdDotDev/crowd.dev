<template>
  <div v-if="form">
    <cr-filter-include-switch v-if="!props.hideIncludeSwitch" v-model="form.include" />
    <div v-if="allOptions.length <= 7">
      <cr-multi-select-checkbox-filter
        v-model="form.value"
        :config="props.config"
        :options="props.options"
      />
    </div>
    <div v-else>
      <cr-multi-select-tags-filter
        v-model="form.value"
        :config="props.config"
        :options="props.options"
      />
    </div>
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
import CrMultiSelectCheckboxFilter
  from '@/shared/modules/filters/components/filterTypes/multiselect/MultiSelectCheckboxFilter.vue';
import CrMultiSelectTagsFilter
  from '@/shared/modules/filters/components/filterTypes/multiselect/MultiSelectTagsFilter.vue';

const props = defineProps<{
  modelValue: MultiSelectFilterValue,
  config: MultiSelectFilterConfig
} & MultiSelectFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: MultiSelectFilterValue): void, (e: 'update:data', value: any): void}>();

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
  if (!form.value || Object.keys(form.value).length < 2) {
    form.value = defaultForm;
  }
});
</script>

<script lang="ts">
export default {
  name: 'CrMultiSelectFilter',
};
</script>
