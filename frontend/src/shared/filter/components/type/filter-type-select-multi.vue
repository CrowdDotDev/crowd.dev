<template>
  <app-include-toggle
    v-if="!isCustom"
    v-model="includeModel"
  />
  <div class="filter-type-select filter-type-select-multi filter-content-wrapper">
    <div
      v-for="option of computedOptions"
      :key="option.name"
      class="filter-type-select-option"
      :class="`${option.selected ? 'is-selected' : ''} ${
        option.soon ? 'is-disabled' : ''
      }`"
      data-qa="filter-select-option"
      :data-qa-value="option.value"
      @click="handleOptionClick(option)"
    >
      <div class="flex items-center justify-between h-4">
        <div class="flex items-center">
          <el-checkbox
            v-model="option.selected"
            class="filter-checkbox"
            :disabled="option.soon"
            @change="handleOptionClick(option)"
          />
          <slot name="optionPrefix" :item="option" />
          {{ option.label }}
          <span
            v-if="option.soon"
            class="absolute right-0 inset-y-0 text-gray-400 italic text-xs flex items-center"
          >Soon</span>
        </div>
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
    type: Array,
    default: () => [],
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

const valuesEqual = (valueA, valueB) => {
  if (Array.isArray(valueA)) {
    return (
      valueA[0] === valueB[0] && valueA[1] === valueB[1]
    );
  }
  return valueA === valueB;
};

const computedOptions = computed(() => props.options.map((o) => ({
  ...o,
  selected: model.value.some((i) => valuesEqual(o.value, i.value)),
})));

const handleOptionClick = (option) => {
  if (option.soon) {
    return;
  }

  if (
    !props.value.some((item) => valuesEqual(item.value, option.value))
  ) {
    model.value.push(option);
  } else {
    const index = model.value.findIndex((o) => valuesEqual(o.value, option.value));
    model.value.splice(index, 1);
  }
};

</script>

<script>
export default {
  name: 'AppFilterTypeSelectMulti',
};
</script>
