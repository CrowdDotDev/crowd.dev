<template>
  <el-input
    ref="inputRef"
    class="insights-projects-select-input"
    placeholder="Select project"
    readonly
    :suffix-icon="isPopoverVisible ? ArrowUpIcon : ArrowDownIcon"
    @click="openPopover"
  />

  <el-popover
    v-model:visible="isPopoverVisible"
    :virtual-ref="inputRef"
    placement="bottom"
    trigger="manual"
    virtual-triggering
    popper-class="insights-projects-select-popper"
    :teleported="false"
  >
    <div class="mb-2 border-b border-gray-100 px-2 pt-2 pb-1 w-full">
      <el-input
        id="filterSearch"
        ref="searchQueryInput"
        v-model="searchQuery"
        placeholder="Search..."
        class="filter-dropdown-search"
        :prefix-icon="SearchIcon"
        @input="onSearchProjects(searchQuery)"
      />
    </div>

    <div class="p-2">
      <div v-if="displayProjects.length" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <div
            v-for="project of displayProjects"
            :key="project.id"
            class="h-10 flex items-center px-3 text-xs text-gray-900 hover:bg-gray-50 rounded cursor-pointer"
            @click="onOptionClick(project)"
          >
            <lf-avatar
              :src="project.url"
              :name="project.name"
              :size="24"
              class="!rounded-md border border-gray-200"
            />
            <span class="ml-2 text-gray-900 text-sm">{{ project.name }}</span>
          </div>
        </div>
      </div>
      <div v-else class="text-gray-400 px-3 h-10 flex items-center">
        No projects found
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { h, ref, computed } from 'vue';
import { InsightsProjectModel } from '@/modules/admin/modules/insights-projects/models/insights-project.model';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { useInsightsProjectsStore } from '../../insights-projects/pinia';

const SearchIcon = h(
  'i', // type
  { class: 'fa-light fa-magnifying-glass c-icon' }, // props
  [],
);

const ArrowDownIcon = h(
  'i', // type
  { class: 'fa-light fa-chevron-down c-icon' }, // props
  [],
);

const ArrowUpIcon = h(
  'i', // type
  { class: 'fa-light fa-chevron-up c-icon' }, // props
  [],
);

const emit = defineEmits<{(e: 'onAddProject', projectId: string): void }>();
const props = defineProps<{
  selectedProjects: InsightsProjectModel[];
}>();

const insightsProjectsStore = useInsightsProjectsStore();

const inputRef = ref(null);
const searchQuery = ref('');
const isPopoverVisible = ref(false);
const displayProjects = computed(() => removeSelectedProject(
  insightsProjectsStore.searchInsightsProjects(searchQuery.value),
));

const removeSelectedProject = (projects: InsightsProjectModel[]) => {
  const selectedProjectsIds = props.selectedProjects.map(
    (project) => project.id,
  );
  return projects.filter(
    (project) => !selectedProjectsIds.includes(project.id),
  );
};

const onSearchProjects = (query: string) => {
  searchQuery.value = query;
};

const openPopover = () => {
  isPopoverVisible.value = true;
};

const onOptionClick = (project: InsightsProjectModel) => {
  isPopoverVisible.value = false;

  emit('onAddProject', project.id);
};
</script>

<script lang="ts">
export default {
  name: 'LfInsightsProjectsListDropdown',
};
</script>

<style lang="scss">
.insights-projects-select-popper.el-popper {
  width: 100% !important;
  max-height: 480px;
  overflow: auto;
  @apply p-0;
}

.insights-projects-select-input {
  @apply cursor-pointer relative w-full;

  .el-input__inner {
    @apply cursor-pointer;
  }
}
</style>
