<template>
  <el-dropdown placement="bottom-end" trigger="click" size="large">
    <el-button
      class="filter-dropdown-trigger"
    >
      <i class="ri-lg ri-filter-3-line mr-2" />
      Filters
    </el-button>
    <template #dropdown>
      <div class="-m-2 border-b border-gray-100 p-2 mb-2">
        <el-input
          ref="queryInput"
          v-model="search"
          placeholder="Search..."
          class="filter-dropdown-search"
        >
          <template #prefix>
            <i class="ri-search-line" />
          </template>
        </el-input>
      </div>
      <el-dropdown-item
        v-for="{ key, label, iconClass } in filteredOptions"
        :key="key"
        :class="{ 'is-selected': isSelected(key) }"
        :disabled="isSelected(key)"
        @click="add(key)"
      >
        <div class="flex justify-between w-full">
          <span><i :class="iconClass" class="text-base text-black mr-2" />{{ label }}</span>
          <i :class="isSelected(key) ? 'opacity-100' : 'opacity-0'" class="ri-check-line !text-brand-600 !mr-0 ml-1" />
        </div>
      </el-dropdown-item>
      <!-- CUSTOM ATTRIBUTES -->
      <template v-if="props.customConfig && Object.keys(props.customConfig).length > 0 && filteredCustomOptions.length > 0">
        <div
          class="el-dropdown-title"
        >
          Custom Attributes
        </div>
        <el-dropdown-item
          v-for="{ key, label } in filteredCustomOptions"
          :key="key"
          :class="{ 'is-selected': isSelected(key) }"
          @click="add(key)"
        >
          <div class="flex justify-between w-full">
            <span>{{ label }}</span>
            <i :class="isSelected(key) ? 'opacity-100' : 'opacity-0'" class="ri-check-line !text-brand-600 !mr-0 ml-1" />
          </div>
        </el-dropdown-item>
      </template>

      <div
        v-if="filteredOptions.length === 0 && filteredCustomOptions.length === 0"
        class="el-dropdown-title"
      >
        No results
      </div>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import {
  computed,
  defineProps, ref,
} from 'vue';
import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';

const props = defineProps<{
  config: Record<string, FilterConfig>,
  customConfig: Record<string, FilterConfig>,
  modelValue: string[]
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string[]), (e: 'open', value: string)}>();

const search = ref('');

const matchesSearch = (label: string, query: string): boolean => label.toLowerCase().includes(query.toLowerCase());
const isSelected = (key: string): boolean => props.modelValue.includes(key);

const options = computed(() => Object.entries(props.config).map(([key, configuration]: [string, FilterConfig]) => ({
  ...configuration,
  key,
})));

const customOptions = computed(() => Object.entries(props.customConfig).map(([key, configuration]: [string, FilterConfig]) => ({
  ...configuration,
  key,
})));

const filteredOptions = computed(() => options.value.filter((filter) => matchesSearch(filter.label, search.value)));

const filteredCustomOptions = computed(() => customOptions.value.filter((filter) => matchesSearch(filter.label, search.value)));

const add = (key: string) => {
  if (isSelected(key)) {
    return;
  }
  search.value = '';
  emit('open', key);
  emit('update:modelValue', [...props.modelValue, key]);
};

</script>

<script lang="ts">
export default {
  name: 'CrFilterDropdown',
};
</script>
