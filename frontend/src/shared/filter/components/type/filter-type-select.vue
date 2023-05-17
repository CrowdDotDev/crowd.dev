<template>
  <app-include-toggle
    v-if="!isCustom"
    v-model="includeModel"
  />
  <div class="filter-type-select filter-content-wrapper">
    <div
      v-for="option of computedOptions"
      :key="option.name"
      class="filter-type-select-option"
      :class="option.selected ? 'is-selected' : ''"
      data-qa="filter-select-option"
      @click="handleOptionClick(option)"
    >
      <div class="flex items-center justify-between h-4">
        <div class="flex items-center">
          {{ option.label }}
        </div>
        <i
          v-if="option.selected"
          class="ri-check-line text-brand-600 absolute right-0 mr-4"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  value: {
    type: String,
    default: () => '',
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  include: {
    type: Boolean,
    default: true,
  },
});
const emit = defineEmits(['update:value', 'update:include']);

const model = computed({
  get() {
    return props.value;
  },
  set(v) {
    emit('update:value', v);
  },
});

const includeModel = computed({
  get() {
    return props.include;
  },
  set(v) {
    emit('update:include', v);
  },
});

const computedOptions = computed(() => props.options.map((o) => ({
  ...o,
  selected:
        JSON.stringify(model.value)
        === JSON.stringify(o.value),
})));

const handleOptionClick = (option) => {
  model.value = option.value;
};
</script>

<script>
export default {
  name: 'AppFilterTypeSelect',
};
</script>

<style lang="scss">
.filter-type-select {
  &-option {
    @apply flex items-center text-black px-4 py-3 text-xs cursor-pointer relative;
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
    }
  }
}
</style>
