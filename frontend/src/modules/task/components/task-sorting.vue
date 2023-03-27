<template>
  <el-dropdown
    class="ml-4"
    placement="bottom-end"
    trigger="click"
  >
    <div class="flex items-center text-xs">
      <span class="text-gray-500">Sort:</span>
      <span class="text-gray-900 pl-1">{{
        selectedLabel
      }}</span>
      <i
        class="ri-arrow-down-s-line text-base ml-1 transition transform"
      />
    </div>
    <template #dropdown>
      <el-dropdown-menu class="w-55">
        <el-dropdown-item
          v-for="s of sortings"
          :key="s.value"
          class="!px-3"
          :class="{ 'bg-brand-25': s.value === sort }"
          @click="changeSorting(s.value)"
        >
          <div class="flex justify-between w-full">
            <span class="text-xs">{{ s.label }}</span>
            <span
              v-if="s.subLabel"
              class="text-2xs text-gray-400"
            >{{ s.subLabel }}</span>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { ref, defineEmits, computed } from 'vue';

const emit = defineEmits(['change']);

const sort = ref('createdAt_DESC');

const sortings = ref([
  {
    label: 'Creation date',
    subLabel: 'Newest first',
    value: 'createdAt_DESC',
  },
  {
    label: 'Due date',
    subLabel: 'Earliest first',
    value: 'dueDate_ASC',
  },
  {
    label: 'Title',
    subLabel: 'A-Z',
    value: 'name_ASC',
  },
]);

const selectedLabel = computed(() => {
  const selected = sortings.value.find(
    (s) => s.value === sort.value,
  );
  return selected ? selected.label : '';
});

const changeSorting = (sorting) => {
  sort.value = sorting;
  emit('change', sorting);
};
</script>

<script>
export default {
  name: 'AppTaskSorting',
};
</script>
