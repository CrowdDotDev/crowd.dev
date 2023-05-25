<template>
  <div class="flex justify-start">
    <el-switch
      v-model="model"
      :active-text="modelValue ? 'Include' : 'Exclude'"
      class="w-fit flex !justify-start !m-0"
      size="small"
      data-qa="filter-include-switch"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps<{
  modelValue: boolean
}>();

const model = computed<boolean>({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});
</script>

<script lang="ts">
export default {
  name: 'CrFilterIncludeSwitch',
};
</script>
