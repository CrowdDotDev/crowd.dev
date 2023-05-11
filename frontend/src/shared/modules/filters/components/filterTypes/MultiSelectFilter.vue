<template>
  <div v-if="form">
    Multi select
    <!-- TODO: prepare multi select filter -->
  </div>
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, onMounted,
} from 'vue';
import {
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: MultiSelectFilterValue
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: MultiSelectFilterValue)}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: MultiSelectFilterValue) => emit('update:modelValue', value),
});

const defaultForm: MultiSelectFilterValue = {
  value: [],
  exclude: false,
};

const rules: any = {
  value: {
    required,
  },
};

const $v = useVuelidate(rules, form);

onMounted(() => {
  if (!form.value) {
    form.value = defaultForm;
  }
});
</script>

<script lang="ts">
export default {
  name: 'CrMultiSelectFilter',
};
</script>
