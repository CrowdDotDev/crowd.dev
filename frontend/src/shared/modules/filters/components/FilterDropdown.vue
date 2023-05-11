<template>
  <el-dropdown>
    <el-button class="btn btn--bordered btn--md">
      <i class="ri-lg ri-filter-3-line mr-2" /> Filters
    </el-button>
    <template #dropdown>
      <el-dropdown-item v-for="(configuration, key) in props.config" :key="key" @click="emit('open', key)">
        {{ configuration.label }}
      </el-dropdown-item>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import {
  defineProps, ref, watch,
} from 'vue';
import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';

const props = defineProps<{
  config: Record<string, FilterConfig>,
}>();

const emit = defineEmits<{(e: 'open', value: string)}>();

const data = ref({});

watch(() => data.value, (value) => {
  // Trigger sync with url query
}, { immediate: true, deep: true });
</script>

<script lang="ts">
export default {
  name: 'CrFilterDropdown',
};
</script>
