<template>
  <div class="filter-with-operator-and-input">
    <div class="flex justify-between items-center">
      <app-inline-select-input
        v-model="operator"
        popper-placement="bottom-start"
        prefix="Text:"
        class="mb-2"
        :options="computedOperatorOptions"
      />
      <app-include-toggle
        v-model="includeModel"
        class="mt-0"
      />
    </div>
    <el-input
      ref="inputRef"
      v-model="model"
      placeholder="Enter a value"
      :disabled="
        operator === 'is_empty'
          || operator === 'is_not_empty'
      "
    />
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
    emit('update:operator', v);
  },
});
const expanded = computed(() => props.isExpanded);
const computedOperatorOptions = computed(() => Object.keys(filterOperators.string.operator).map(
  (o) => ({
    value: o,
    label: filterOperators.string.operator[o],
  }),
));
const inputRef = ref(null);

watch(expanded, async (newValue) => {
  if (newValue) {
    inputRef.value.focus();
  }
});
</script>

<script>
export default {
  name: 'AppFilterTypeString',
};
</script>
