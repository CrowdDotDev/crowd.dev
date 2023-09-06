<template>
  <div class="flex justify-start items-center border-b border-gray-100 p-4">
    <el-switch
      v-model="model"
      :active-text="modelValue ? 'Include' : 'Exclude'"
      class="w-fit flex !justify-start !m-0 filter-include-switch"
      size="small"
      data-qa="filter-include-switch"
    />

    <el-tooltip
      content="If excluded, turns the filter into a negative condition"
      placement="top"
    >
      <i class="ri-question-line text-gray-400" />
    </el-tooltip>
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

<style lang="scss">
.filter-include-switch{
 .el-switch__label{
   font-weight: normal !important;
 }
}
</style>
