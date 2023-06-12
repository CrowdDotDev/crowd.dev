<template>
  <div
    :class="selected ? 'is-selected' : ''"
    v-bind="$attrs"
    class="filter-select-option"
    @click="selectOption()"
  >
    <slot />
    <i
      v-if="selected"
      class="ri-check-line text-brand-600 absolute right-0 mr-4"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean,
  value: boolean | string,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean | string): void}>();

const selected = computed(() => props.modelValue === props.value);

const selectOption = () => {
  emit('update:modelValue', props.value);
};

</script>

<script lang="ts">
export default {
  name: 'CrFilterSelectOption',
};
</script>

<style lang="scss" scoped>
.filter-select-option{
  @apply flex items-center text-black px-4 py-3 text-xs cursor-pointer relative transition;
  border-radius: 4px;

  &:not(:last-of-type) {
    @apply mb-1;
  }

  i {
    @apply mr-2;
  }

  i:not(.ri-delete-bin-line) {
    @apply text-gray-400;
  }

  &:focus,
  &:not(.is-disabled):hover,
  &:not(.is-disabled):focus {
    @apply text-black bg-gray-50;
  }

  &.is-disabled {
    @apply cursor-not-allowed;
  }

  &.is-selected,
  &:focus.is-selected {
    @apply relative bg-brand-50;
    i {
      @apply mr-3 text-brand-600;
    }

    &:hover{
      @apply bg-brand-50;
    }
  }
}
</style>
