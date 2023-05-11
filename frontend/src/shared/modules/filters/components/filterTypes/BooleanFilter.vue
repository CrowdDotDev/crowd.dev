<template>
  <div v-if="form">
    Boolean
    <!-- TODO: prepare boolean filter -->
  </div>
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, onMounted,
} from 'vue';
import { BooleanFilterValue } from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: BooleanFilterValue
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: BooleanFilterValue)}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: BooleanFilterValue) => emit('update:modelValue', value),
});

const defaultForm: BooleanFilterValue = {
  value: true,
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
  name: 'CrBooleanFilter',
};
</script>
