<template>
  <div
    v-bind="$attrs"
    ref="editable"
    contenteditable
    class="outline-none"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string): any }>();

const editable = ref<any>(null);
const proxy = ref<string>(props.modelValue);
const onInput = (e: InputEvent) => {
  const value = e.target?.innerText;
  proxy.value = value;
  emit('update:modelValue', value);
};

const setDefualtValue = () => {
  editable.value.innerText = props.modelValue;
};

watch(() => props.modelValue, () => {
  if (proxy.value !== props.modelValue) {
    setDefualtValue();
  }
});

onMounted(() => {
  setDefualtValue();
});
</script>

<script lang="ts">
export default {
  name: 'LfConteneditable',
};
</script>
