<template>
  <cr-select-filter v-model="form" :config="props.config as SelectFilterConfig" :options="data.options || []" />
</template>

<script setup lang="ts">
import {
  defineProps, defineEmits, computed, watch,
} from 'vue';
import CrSelectFilter from '@/shared/modules/filters/components/filterTypes/SelectFilter.vue';
import {
  SelectFilterConfig,
} from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  modelValue: string,
  config: CustomFilterConfig,
  data: any,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string), (e: 'update:data', value: any),}>();
const activityTypeStore = useActivityTypeStore();
const { types } = storeToRefs(activityTypeStore);

const form = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

const data = computed({
  get: () => props.data,
  set: (value: any) => emit('update:data', value),
});
watch(() => types, (typesValue: any) => {
  const platforms = {
    ...typesValue.value.default,
    ...typesValue.value.custom,
  };
  data.value.options = Object.entries(platforms).map(([platform, activityTypes]: [string, any]) => ({
    label: platform.replaceAll(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`),
    options: Object.entries(activityTypes).map(([activityType, activityTypeData]) => ({
      label: activityTypeData.display.short,
      value: `${platform}:${activityType}`,
    })),
  }));
}, { immediate: true });
</script>
