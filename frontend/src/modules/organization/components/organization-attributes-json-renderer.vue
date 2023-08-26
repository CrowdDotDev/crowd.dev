<template>
  <div class="mt-1">
    <div
      v-for="[key, value] of Object.entries(attributeValue)"
      :key="key"
      class="text-xs"
    >
      <span
        class="font-medium mr-1"
        :class="{
          'text-gray-500': !!nestedKeyParser,
        }"
      >{{ keyParser(key) }}{{ !!nestedKeyParser ? '' : ':' }}</span>
      <div v-if="nestedKeyParser">
        <div
          v-for="[nestedKey, nestedValue] of Object.entries(value)"
          :key="nestedKey"
          class="last:mb-2"
        >
          <span class="font-medium mr-1">{{ nestedKeyParser(nestedKey) }}:</span>
          <span>{{ parsedValue(nestedValue) }}</span>
        </div>
      </div>
      <span v-else>{{ parsedValue(value) }}</span>
    </div>
  </div>
</template>

<script setup>
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
  nestedKeyParser: {
    type: Function,
    default: null,
  },
  valueParser: {
    type: Function,
    default: null,
  },
});

const parsedValue = (value) => {
  if (props.valueParser) {
    return props.valueParser(value);
  }

  return value;
};
</script>
