<template>
  <th :class="props.sticky ? 'is-sticky' : ''">
    <div
      class="flex items-center gap-1"
      :class="[props.property ? 'cursor-pointer select-none' : '']"
      @click="sort()"
    >
      <slot />
      <i v-if="model === `${props.property}_DESC`" class="ri-arrow-down-s-fill text-gray-500" />
      <i v-else-if="model === `${props.property}_ASC`" class="ri-arrow-up-s-fill text-gray-500" />
    </div>
  </th>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: string,
  property?: string,
  sticky?: boolean,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string): void}>();

const model = computed<string>({
  get() {
    return props.modelValue || '';
  },
  set(value: string) {
    emit('update:modelValue', value);
  },
});

const sort = () => {
  if (model.value === `${props.property}_DESC`) {
    model.value = `${props.property}_ASC`;
  } else {
    model.value = `${props.property}_DESC`;
  }
};
</script>

<script lang="ts">
export default {
  name: 'LfTableHead',
};
</script>
