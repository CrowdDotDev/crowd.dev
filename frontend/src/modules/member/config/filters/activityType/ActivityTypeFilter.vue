<template>
  <cr-select-filter v-model="form" :options="options" />
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import CrSelectFilter from '@/shared/modules/filters/components/filterTypes/SelectFilter.vue';
import { SelectFilterOptionGroup } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';

const props = defineProps<{
  modelValue: string
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string)}>();

const form = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

// TODO: fetch activity types
const options: SelectFilterOptionGroup[] = [];
</script>
