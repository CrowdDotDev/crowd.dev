<template>
  <el-input
    v-model="model"
    :rows="filteredValue ? Object.keys(filteredValue).length + 2 : 0"
    type="textarea"
    disabled
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  type: {
    type: String,
    default: null,
  },
  filterValue: {
    type: Function,
    default: null,
  },
});

const filteredValue = computed(() => {
  if (props.filterValue && props.modelValue) {
    return props.filterValue(props.modelValue);
  }

  return props.modelValue;
});

const model = computed(() => JSON.stringify(filteredValue.value, null, ' '));

</script>
