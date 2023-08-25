<template>
  <div class="mt-1">
    <div
      v-for="(objectValue, index) of attributeValue"
      :key="index"
      class="text-xs mb-2 last:mb-0"
    >
      <div
        v-for="[key, value] of Object.entries(objectValue)"
        :key="key"
      >
        <span v-if="value">
          <span
            class="font-medium mr-1"
          >{{ keyParser(key) }}:</span>
          <span>{{ parsedValue(key, value) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  attributeValue: {
    type: Array,
    required: true,
    default: () => [],
  },
  keyParser: {
    type: Function,
    required: true,
  },
  valueParser: {
    type: Function,
    default: null,
  },
});

const parsedValue = (key, value) => {
  if (props.valueParser) {
    return props.valueParser(key, value);
  }

  return value;
};
</script>
