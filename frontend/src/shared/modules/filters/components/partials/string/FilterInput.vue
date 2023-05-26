<template>
  <el-input
    v-model="model"
    class="filter-input"
    :placeholder="placeholder"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string,
  placeholder?: string,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string): void}>();

const model = computed<string>({
  get() {
    return props.modelValue;
  },
  set(value: string) {
    emit('update:modelValue', value);
  },
});
</script>

<script lang="ts">
export default {
  name: 'CrFilterInput',
};
</script>

<style scope lang="scss">
.filter-input {
  .el-input__wrapper,
  .el-input__wrapper.is-focus,
  .el-input__wrapper:hover {
    border: none !important;
    @apply bg-gray-50 shadow-none rounded-md;

    input {
      &,
      &:hover,
      &:focus {
        border: none !important;
        @apply bg-gray-50 shadow-none outline-none h-full min-h-8;
      }
    }
  }
}
</style>
