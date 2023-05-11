<template>
  <cr-multi-select-filter v-model="form" :options="options" />
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import CrMultiSelectFilter from '@/shared/modules/filters/components/filterTypes/MultiSelectFilter.vue';
import { MultiSelectFilterOptionGroup } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';

const props = defineProps<{
  modelValue: string
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string)}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

// TODO: fetch activity types
const options: MultiSelectFilterOptionGroup[] = [];
</script>
