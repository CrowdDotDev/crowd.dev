<template>
  <div
    class="mt-1"
  >
    <div
      v-for="[key, value] of valueSegment"
      :key="key"
      class="text-xs"
    >
      <span
        v-if="parsedValue(value) !== null && parsedValue(value) !== ''"
        class="flex flex-grow items-center justify-between"
      >
        <span class="font-medium mr-1 text-gray-900">{{ keyParser(key) }}</span>
        <span class="text-gray-600">{{ parsedValue(value) }}</span>
      </span>
    </div>
  </div>
  <div
    v-if="displayShowMore"
    class="text-2xs text-brand-500 mt-3 cursor-pointer"
    @click.stop="showMore = !showMore"
  >
    Show {{ showMore ? 'less' : 'more' }}
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  attributeValue: {
    type: Object,
    required: true,
    default: () => {},
  },
  keyParser: {
    type: Function,
    required: true,
  },
  valueParser: {
    type: Function,
    default: null,
  },
  filterValue: {
    type: Function,
    default: null,
  },
});

const showMore = ref(false);

const parsedAttributeValue = computed(() => {
  if (props.filterValue && props.attributeValue) {
    return props.filterValue(props.attributeValue);
  }

  return props.attributeValue;
});

const displayShowMore = computed(() => Object.entries(parsedAttributeValue.value).length > 5);
const valueSegment = computed(() => {
  if (displayShowMore.value && !showMore.value) {
    return Object.entries(parsedAttributeValue.value).slice(0, 5);
  }

  return Object.entries(parsedAttributeValue.value);
});

const parsedValue = (value) => {
  if (props.valueParser) {
    return props.valueParser(value);
  }

  return value;
};
</script>
