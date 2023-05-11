<template>
  <div class="my-2 flex justify-start pr-4">
    <el-switch
      v-model="model"
      :active-text="modelValue ? 'Include' : 'Exclude'"
      class="w-fit flex !justify-start"
      size="small"
      data-qa="filter-include-switch"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});
</script>

<script>
export default {
  name: 'AppIncludeToggle',
};
</script>
