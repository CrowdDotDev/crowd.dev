<template>
  <el-input
    ref="inputRef"
    v-model="model"
    class="project-groups-select-input"
    placeholder="Select project group..."
    readonly
    :suffix-icon="isPopoverVisible ? ArrowUpIcon : ArrowDownIcon"
    @click="isPopoverVisible = true"
  />

  <el-popover
    v-model:visible="isPopoverVisible"
    :virtual-ref="inputRef"
    placement="bottom-start"
    trigger="manual"
    virtual-triggering
    popper-class="project-groups-select-popper"
    :teleported="false"
    width="255px"
  >
    <div v-if="projectGroups.list.length > 5" class="border-b border-gray-100 px-2 pt-2 pb-1 w-full sticky top-0 bg-white">
      <el-input
        id="filterSearch"
        ref="searchQueryInput"
        v-model="searchQuery"
        placeholder="Search..."
        class="lf-filter-input filter-dropdown-search"
        :prefix-icon="SearchIcon"
        @input="onSearchProjects"
      />
    </div>

    <div class="p-2">
      <div v-if="loading" class="text-gray-400 px-3 h-10 flex items-center">
        Loading
      </div>
      <div v-else-if="projectGroupsList.length" class="flex flex-col gap-1 overflow-auto">
        <div
          v-for="projectGroup of projectGroupsList"
          :key="projectGroup.id"
          class="pr-8 pl-2 h-14 flex items-center hover:bg-gray-50 rounded cursor-pointer"
          :class="{
            'bg-brand-50': projectGroup.id === selectedProjectGroup?.id,
          }"
          @click="onOptionClick(projectGroup.id)"
        >
          <div class="flex gap-2 items-start truncate">
            <div class="block truncate mr-2">
              <div class="h-5 leading-5 text-xs text-gray-900 truncate">
                {{ projectGroup.name }}
              </div>
              <div class="h-5 leading-5 text-3xs text-gray-400">
                {{ pluralize("project", projectGroup.projects.length, true) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-gray-400 px-3 h-10 flex items-center">
        No project groups found
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import {
  h, ref, onMounted, computed, watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { LfService } from '@/modules/lf/segments/lf-segments-service';
import pluralize from 'pluralize';
import debounce from 'lodash/debounce';

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  [],
);

const ArrowDownIcon = h(
  'i', // type
  { class: 'ri-arrow-down-s-line' }, // props
  [],
);

const ArrowUpIcon = h(
  'i', // type
  { class: 'ri-arrow-up-s-line' }, // props
  [],
);

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup, projectGroups } = storeToRefs(lsSegmentsStore);
const { updateSelectedProjectGroup, listProjectGroups } = lsSegmentsStore;

const inputRef = ref(null);
const searchQuery = ref('');
const isPopoverVisible = ref(false);
const projectGroupsList = ref([]);
const loading = ref(false);

const model = computed({
  get() {
    return selectedProjectGroup.value?.name;
  },
  set(id) {
    updateSelectedProjectGroup(id);
  },
});

const queryProjectGroups = () => {
  loading.value = true;
  LfService.queryProjectGroups({
    limit: null,
    offset: 0,
    filter: {
      name: searchQuery.value,
    },
  }).then(({ rows }) => {
    projectGroupsList.value = rows;
  }).finally(() => {
    loading.value = false;
  });
};

watch(projectGroups, (updatedProjectGroups) => {
  projectGroupsList.value = updatedProjectGroups.list;
}, {
  deep: true,
});

onMounted(() => {
  listProjectGroups({
    limit: null,
    offset: 0,
  });
});

const onSearchProjects = debounce(() => {
  queryProjectGroups();
}, 300);

const onOptionClick = (id) => {
  isPopoverVisible.value = false;
  updateSelectedProjectGroup(id);
};
</script>

<script>
export default {
  name: 'AppLfSubProjectsListDropdown',
};
</script>

<style lang="scss">
.project-groups-select-popper.el-popper {
    width: 255px;
    max-height: 480px;
    overflow: auto;
    @apply p-0;
}

.project-groups-select-input {
    @apply cursor-pointer relative w-full;

    .el-input__inner {
        @apply cursor-pointer text-xs truncate pr-6;
    }
}
</style>
