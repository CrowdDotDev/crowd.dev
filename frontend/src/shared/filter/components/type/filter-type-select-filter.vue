<template>
  <div>
    <app-filter-type-select-async
      :fetch-fn="fetchFn"
      :is-expanded="props.isExpanded"
      :is-custom="props.isCustom"
      :value="props.value"
      @update:value="emit('update:value', $event)"
    />
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
} from 'vue';

import AppFilterTypeSelectAsync from '@/shared/filter/components/type/filter-type-select-async.vue';

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
});
const emit = defineEmits(['update:value']);

const fetchFn = ({ query, limit }) => {
  const selected = [];
  props.options.forEach((o) => {
    if (selected.length >= limit) {
      return;
    }
    if (o.value.includes(query)) {
      selected.push({
        ...o,
        id: o.value,
      });
    }
  });
  return selected;
};
</script>

<script>
export default {
  name: 'AppFilterTypeSelectFilter',
};
</script>
