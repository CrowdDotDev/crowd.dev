<template>
  <el-input
    v-model="model"
    clearable
    :placeholder="props.placeholder"
    class="input-with-select"
    @input="changeValue($event)"
  >
    <template #append>
      <slot name="append" />
    </template>
  </el-input>
</template>

<script setup lang="ts">
import {
  defineProps, ref, watch,
} from 'vue';
import { debounce } from 'lodash';

const props = defineProps<{
  modelValue: string,
  placeholder?: string,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string)}>();

const model = ref('');

watch(() => props.modelValue, (value) => {
  model.value = value;
}, {
  immediate: true,
});

const changeValue = debounce((search: string) => {
  emit('update:modelValue', search);
}, 300);

</script>

<script lang="ts">
export default {
  name: 'CrFilterSearch',
};
</script>
