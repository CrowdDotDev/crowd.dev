<template>
  <div class="filter-with-operator-and-input">
    <div class="flex justify-between items-center">
      <app-inline-select-input
        v-model="operator"
        popper-placement="bottom-start"
        prefix="Date:"
        class="mb-2"
        :options="computedOperatorOptions"
      />
      <app-include-toggle
        v-if="!isCustom"
        v-model="includeModel"
        class="mt-0"
      />
    </div>
    <div data-qa="filter-date-input">
      <el-date-picker
        ref="inputRef"
        v-model="model"
        placeholder="Select a date"
        value-format="YYYY-MM-DD"
        format="YYYY-MM-DD"
        class="custom-date-picker"
        popper-class="date-picker-popper"
        v-bind="betweenProps"
        :disabled="
          operator === 'is_empty'
            || operator === 'is_not_empty'
        "
      />
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  defineEmits,
  defineProps,
  watch,
  ref,
} from 'vue';

import filterOperators from '../../helpers/operators';

const props = defineProps({
  value: {
    type: String,
    default: null,
  },
  operator: {
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

const emit = defineEmits([
  'update:value',
  'update:operator',
  'update:include',
]);

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

const operator = computed({
  get() {
    return props.operator;
  },
  set(v) {
    // Reset values when operator changes
    // Needed because type of value changes each time operator changes
    if (v === 'between' && !Array.isArray(props.value)) {
      model.value = [];
    } else if (
      v !== 'between'
      && Array.isArray(props.value)
    ) {
      model.value = null;
    }
    emit('update:operator', v);
  },
});

const betweenProps = computed(() => (operator.value !== 'between'
  ? {}
  : {
    type: 'daterange',
    'range-separator': 'To',
    'start-placeholder': 'Start date',
    'end-placeholder': 'End date',
  }));

const expanded = computed(() => props.isExpanded);
const computedOperatorOptions = computed(() => Object.keys(filterOperators.date.operator).map(
  (o) => ({
    value: o,
    label: filterOperators.date.operator[o],
  }),
));
const inputRef = ref(null);

watch(expanded, async (newValue) => {
  setTimeout(() => {
    if (newValue) {
      inputRef.value.handleOpen();
    }
  }, 500);
});
</script>

<script>
export default {
  name: 'AppFilterTypeDate',
};
</script>
