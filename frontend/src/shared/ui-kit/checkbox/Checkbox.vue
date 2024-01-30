<template>
  <label
    class="c-checkbox"
    :class="[
      `c-checkbox--${props.size}`,
    ]"
  >
    <input v-model="checked" type="checkbox" :value="props.value">
    <span><slot /></span>
  </label>
</template>

<script setup lang="ts">
import { CheckboxSize } from '@/shared/ui-kit/checkbox/types/CheckboxSize';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  size?: CheckboxSize,
  modelValue: string | boolean,
  value?: string | boolean,
}>(), {
  size: 'medium',
  value: true,
});

const emit = defineEmits<{(e: 'update:modelValue', value: string | boolean): any}>();

const checked = computed<string | boolean>({
  get() {
    return props.modelValue;
  },
  set(val: string | boolean) {
    emit('update:modelValue', val);
  },
});
</script>

<script lang="ts">
export default {
  name: 'CrCheckbox',
};
</script>
