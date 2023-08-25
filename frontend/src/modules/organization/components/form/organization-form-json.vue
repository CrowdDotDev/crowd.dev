<template>
  <div v-if="type === attributesTypes.jsonArray" class="w-full">
    <el-input
      v-for="(_v, index) in model"
      :key="index"
      v-model="model[index]"
      :rows="Object.keys(modelValue[index]).length + 2"
      type="textarea"
      disabled
    />
  </div>
  <el-input
    v-else
    v-model="model"
    :rows="Object.keys(modelValue).length + 2"
    type="textarea"
    disabled
  />
</template>

<script setup>
import { computed } from 'vue';
import { attributesTypes } from '@/modules/organization/types/Attributes';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  type: {
    type: String,
    default: null,
  },
});

const model = computed(() => {
  if (props.type === attributesTypes.jsonArray) {
    return props.modelValue.map((value) => JSON.stringify(value, null, ' '));
  }

  return JSON.stringify(props.modelValue, null, ' ');
});
</script>
