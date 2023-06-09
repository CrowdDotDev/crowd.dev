<template>
  <div
    :class="selected ? 'is-selected' : ''"
    v-bind="$attrs"
    class="filter-select-option"
    data-qa="filter-select-option"
    :data-qa-value="props.value"
    @click="selectOption()"
  >
    <el-checkbox
      v-if="checkbox"
      :model-value="selected"
      class="filter-checkbox h-4"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: string[],
  value: string,
  checkbox: boolean
}>(), { checkbox: true });

const emit = defineEmits<{(e: 'update:modelValue', value: string[]): void}>();

const form = computed({
  get() {
    return props.modelValue;
  },
  set(value: string[]) {
    emit('update:modelValue', value);
  },
});

const selected = computed(() => form.value?.includes(props.value));

const selectOption = () => {
  if (selected.value) {
    form.value = form.value.filter((selected) => selected !== props.value);
  } else {
    form.value = [...form.value, props.value];
  }
};

</script>

<script lang="ts">
export default {
  name: 'CrFilterMultiSelectOption',
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
