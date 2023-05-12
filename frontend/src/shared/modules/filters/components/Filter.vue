<template>
  <div class="mb-8">
    <div class="flex justify-end">
      <cr-filter-dropdown :config="props.config" @open="filterList.push($event)" />
    </div>
    <div class="flex items-center flex-wrap">
      <template v-for="(filter, fi) of filterList" :key="filter">
        <el-button v-if="fi > 0" class="btn btn--bordered btn--md mr-4 w-12" @click="switchOperator">
          {{ operator }}
        </el-button>
        <cr-filter-item v-model="filters[filter]" :config="config[filter]" class="mr-4" @remove="removeFilter(filter)" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineProps, ref, watch,
} from 'vue';
import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import CrFilterDropdown from '@/shared/modules/filters/components/FilterDropdown.vue';
import CrFilterItem from '@/shared/modules/filters/components/FilterItem.vue';

const props = defineProps<{
  config: Record<string, FilterConfig>,
}>();

const filters = ref({});

const operator = ref<'AND' | 'OR'>('AND');
const filterList = ref<string[]>([]);

const relation = computed(() => filterList.value.join(`-${operator.value}-`));

const filtersObject = computed(() => ({
  ...filters.value,
  relation: relation.value,
}));

const switchOperator = () => {
  operator.value = operator.value === 'AND' ? 'OR' : 'AND';
};

const removeFilter = (key) => {
  filterList.value = filterList.value.filter((el) => el !== key);
  filters.value[key] = undefined;
};

watch(() => filtersObject.value, (value) => {
  // TODO: sync with store
  // TODO: sync with query
  console.log(value);
});
</script>

<script lang="ts">
export default {
  name: 'CrFilter',
};
</script>
