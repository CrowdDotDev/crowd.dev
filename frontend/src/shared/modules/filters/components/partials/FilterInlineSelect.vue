<template>
  <div class="filter-select-option">
    <el-dropdown
      placement="bottom-start"
      trigger="click"
      :teleported="false"
      @visible-change="dropdownExpanded = $event"
    >
      <div class="flex items-center">
        <span class="filter-select-option-prefix mr-1">{{
          prefix
        }}</span>
        <span class="filter-select-option-value">{{
          selectOptionLabel
        }}</span>
        <i
          class="ri-arrow-down-s-line ml-1"
          :class="{
            'rotate-180': dropdownExpanded,
          }"
        />
      </div>
      <template #dropdown>
        <el-dropdown-item
          v-for="option of options"
          :key="`option-${option.value}`"
          :class="{
            'is-selected': props.modelValue === option.value,
          }"
          class="flex justify-between"
          @click="model = option.value"
        >
          <span>{{ option.label }}</span>
          <span v-if="option.subLabel" class="text-gray-400 pl-8">{{ option.subLabel }}</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { FilterOperator } from '@/shared/modules/filters/types/FilterOperator';

const emit = defineEmits<{(e: 'update:modelValue', value: string): void}>();
const props = defineProps<{
  modelValue: string,
  options: FilterOperator[],
  prefix: string
}>();

const dropdownExpanded = ref<boolean>(false);
const model = computed<string>({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const selectOptionLabel = computed<string>(() => props.options.find((o) => o.value === model.value)
  ?.label);
</script>

<script  lang="ts">
export default {
  name: 'CrFilterInlineSelect',
};
</script>

<style lang="scss">
.filter-select-option {
  @apply leading-none;
  i {
    transition: transform 0.2s ease;
  }
  &-prefix {
    @apply text-gray-500 text-xs leading-4.5;
  }
  &-value {
    @apply text-gray-900 text-xs leading-4.5;
  }
}
</style>
