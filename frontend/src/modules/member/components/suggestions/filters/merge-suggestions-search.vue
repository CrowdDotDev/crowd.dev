<template>
  <el-input
    v-model="proxy"
    clearable
    :placeholder="props.placeholder"
    class="!h-8"
    @update:model-value="search($event)"
  >
    <template #prefix>
      <i class="ri-search-line text-gray-400" />
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: any): void}>();

const proxy = ref<string>(props.modelValue);

const search = (val: string) => {
  setTimeout(() => {
    if (proxy.value === val) {
      emit('update:modelValue', val);
    }
  }, 300);
};
</script>

<script lang="ts">
export default {
  name: 'AppMergeSuggestionsSearch',
};
</script>
