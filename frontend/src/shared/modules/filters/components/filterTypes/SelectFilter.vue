<template>
  <div v-if="form">
    <cr-filter-include-switch v-if="!props.hideIncludeSwitch" v-model="form.include" />
    <div v-if="allOptions.length > 7" class="border-b border-gray-100 px-2 py-1">
      <el-input
        ref="queryInput"
        v-model="search"
        placeholder="Search..."
        class="filter-dropdown-search"
      >
        <template #prefix>
          <i class="ri-search-line" />
        </template>
        <template #suffix>
          <i v-if="search.length > 0" class="ri-close-line text-base cursor-pointer" @click="search = ''" />
        </template>
      </el-input>
    </div>
    <div class="max-h-58 overflow-auto py-3 px-2">
      <template v-for="(group, gi) of filteredOptions" :key="gi">
        <div
          v-if="group.label && group.options.length > 0"
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
import { computed, onMounted, ref } from 'vue';
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

const emit = defineEmits<{(e: 'update:modelValue', value: SelectFilterValue): void}>();

const search = ref('');

const allOptions = computed(() => props.options.map((g) => g.options).flat());

const filteredOptions = computed(() => props.options.map((g) => ({
  ...g,
  options: g.options.filter((o) => o.label.toLowerCase().includes(search.value.toLowerCase())),
})));

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
  form.value = {
    ...defaultForm,
    ...form.value,
  };
});
</script>

<script lang="ts">
export default {
  name: 'CrSelectFilter',
};
</script>
