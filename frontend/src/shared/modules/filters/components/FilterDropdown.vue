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
      <template v-for="(configuration, key) in props.config" :key="key">
        <el-dropdown-item
          v-if="matchesSearch(configuration.label, search)"
          :class="{ 'is-selected': isSelected(key) }"
          :disabled="isSelected(key)"
          @click="add(key)"
        >
          <div class="flex justify-between w-full">
            <span>{{ configuration.label }}</span>
            <i :class="isSelected(key) ? 'opacity-100' : 'opacity-0'" class="ri-check-line !text-brand-600 !mr-0 ml-1" />
          </div>
        </el-dropdown-item>
      </template>
      <!-- CUSTOM ATTRIBUTES -->
      <template v-if="props.customConfig && Object.keys(props.customConfig).length > 0">
        <div

          class="el-dropdown-title"
        >
          Custom Attributes
        </div>
        <template v-for="(configuration, key) in props.customConfig" :key="key">
          <el-dropdown-item
            v-if="matchesSearch(configuration.label, search)"
            :class="{ 'is-selected': isSelected(key) }"
            @click="add(key)"
          >
            <div class="flex justify-between w-full">
              <span>{{ configuration.label }}</span>
              <i :class="isSelected(key) ? 'opacity-100' : 'opacity-0'" class="ri-check-line !text-brand-600 !mr-0 ml-1" />
            </div>
          </el-dropdown-item>
        </template>
      </template>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import {
  defineProps, ref,
} from 'vue';
import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';

const props = defineProps<{
  config: Record<string, FilterConfig>,
  customConfig: Record<string, FilterConfig>,
  modelValue: string[]
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string[])}>();

const search = ref('');

const matchesSearch = (label: string, search: string): boolean => label.toLowerCase().includes(search.toLowerCase());
const isSelected = (key: string): boolean => props.modelValue.includes(key);

const add = (key: string) => {
  if (isSelected(key)) {
    return;
  }
  search.value = '';
  emit('update:modelValue', [...props.modelValue, key]);
};

</script>

<script lang="ts">
export default {
  name: 'CrFilterDropdown',
};
</script>
