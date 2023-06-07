<template>
  <div v-if="form">
    <cr-filter-include-switch v-if="!props.hideIncludeSwitch" v-model="form.include" />
    <div class="p-4">
      <p class="text-xs text-gray-500 pb-3">
        {{ props.config.label }}
      </p>
      <el-radio-group v-model="form.value" class="flex-col !items-start">
        <el-radio :label="true" size="large" class="!mr-0 !h-6 !font-normal !mb-3 flex items-center">
          True
        </el-radio>
        <el-radio :label="false" size="large" class="!mr-0 !h-5 !font-normal">
          False
        </el-radio>
      </el-radio-group>
    </div>
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
  if (!form.value || Object.keys(form.value).length < 2) {
    form.value = defaultForm;
  }
});
</script>

<script lang="ts">
export default {
  name: 'CrBooleanFilter',
};
</script>
