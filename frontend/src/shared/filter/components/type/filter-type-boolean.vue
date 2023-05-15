<template>
  <app-include-toggle
    v-if="!isCustom"
    v-model="includeModel"
  />
  <div class="filter-type-boolean px-2 pb-4 pt-2">
    <div class="text-gray-500 mb-2 font-medium text-2xs">
      {{ label }}
    </div>
    <div
      class="filter-type-select-option"
      :class="model === true ? 'is-selected' : ''"
      data-qa="filter-boolean-true"
      @click="handleOptionClick(true)"
    >
      True
      <i
        v-if="model === true"
        class="ri-check-line text-brand-600 absolute right-0 mr-4"
      />
    </div>
    <div
      class="filter-type-select-option"
      :class="model === false ? 'is-selected' : ''"
      data-qa="filter-boolean-false"
      @click="handleOptionClick(false)"
    >
      False
      <i
        v-if="model === false"
        class="ri-check-line text-brand-600 absolute right-0 mr-4"
      />
    </div>
  </div>
</template>

<script setup>
import { defineEmits, defineProps, computed } from 'vue';

const props = defineProps({
  value: {
    type: Boolean,
    default: null,
  },
  label: {
    type: String,
    default: null,
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

const handleOptionClick = (value) => {
  model.value = value;
};
</script>

<script>
export default {
  name: 'AppFilterTypeBoolean',
};
</script>
