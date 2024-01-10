<template>
  <div v-if="!!filteredValue" class="flex flex-col w-full gap-2">
    <el-input
      v-for="[key] in Object.entries(filteredValue)"
      :key="key"
      v-model="filteredValue[key]"
      disabled
    >
      <template #prefix>
        <span class="font-medium">
          {{ key }}:
        </span>
      </template>
    </el-input>
  </div>
  <el-input v-else disabled />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
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

</script>
