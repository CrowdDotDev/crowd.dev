<template>
  <div class="c-field" v-bind="$attrs">
    <div class="flex justify-between c-field__header">
      <slot name="label" :label-text="props.labelText">
        <label v-if="props.labelText" :for="props.for" class="c-field__label">
          {{ props.labelText }} <span v-if="props.required" class="c-field__required">*</span>
        </label>
      </slot>
      <slot name="action" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  labelText?: string,
  required?: boolean;
  for?: string;
}>(), {
  labelText: undefined,
  required: false,
  for: undefined,
});
</script>

<script lang="ts">
export default {
  name: 'CrField',
};
</script>
