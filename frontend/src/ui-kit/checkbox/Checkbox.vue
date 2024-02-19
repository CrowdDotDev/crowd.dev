<template>
  <label
    class="c-checkbox"
    :class="[
      `c-checkbox--${props.size}`,
      props.multiple && 'c-checkbox--multiple',
    ]"
  >
    <input v-model="checked" type="checkbox" :value="props.value" :disabled="props.disabled">
    <span class="flex flex-col">
      <slot />
    </span>
  </label>
</template>

<script setup lang="ts">
import { CheckboxSize } from '@/ui-kit/checkbox/types/CheckboxSize';
import { computed, withDefaults } from 'vue';

const props = withDefaults(defineProps<{
  size?: CheckboxSize,
  modelValue: string | boolean,
  value?: string | boolean,
  disabled?: boolean,
  multiple?: boolean,
}>(), {
  size: 'medium',
  value: true,
  disabled: false,
  multiple: false,
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
