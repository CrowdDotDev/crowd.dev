<template>
  <el-popover
    v-model:visible="isPopoverVisible"
    placement="bottom-start"
    trigger="click"
    popper-class="project-groups-select-popper"
    :teleported="false"
    width="255px"
    @show="onShow"
    @hide="onHide"
  >
    <template #reference>
      <el-input
        v-model="model"
        class="project-groups-select-input"
        placeholder="Select project group..."
        readonly
        :suffix-icon="isPopoverVisible ? ArrowUpIcon : ArrowDownIcon"
      />
    </template>

    <div v-if="isSearchVisible" class="border-b border-gray-100 px-1 w-full sticky top-0 bg-white">
      <el-input
        id="filterSearch"
        v-model="searchQuery"
        placeholder="Search..."
        class="filter-dropdown-search"
        :prefix-icon="SearchIcon"
        clearable
        @input="onSearchProjects"
      />
    </div>

    <div>
      <div v-if="loading" class="text-gray-400 px-3 h-20 flex items-center justify-center">
        <lf-icon-old name="loader-4-line" class="animate-spin text-gray-400" :size="16" />
        <span class="text-tiny ml-1 text-gray-400">
          Loading project groups...
        </span>
      </div>
      <div v-else-if="projectGroupsList.length" class="flex flex-col gap-1 overflow-auto p-2">
        <div
          v-for="projectGroup of projectGroupsList"
          :key="projectGroup.id"
          class="py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer"
          :class="{
            'bg-primary-50': projectGroup.id === selectedProjectGroup?.id,
          }"
          @click="onOptionClick(projectGroup)"
        >
          <div class="flex gap-0.5 items-start truncate">
            <div class="block truncate mr-2">
              <div class="text-small leading-5 text-gray-900 truncate">
                {{ projectGroup.name }}
              </div>
              <div class="text-tiny text-gray-400">
                {{ pluralize('project', projectGroup.projects.length, true) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-gray-400 px-3 h-20 flex items-center justify-center">
        <span class="text-tiny text-gray-400">
          No project groups found
        </span>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import {
  h, ref, onMounted, computed,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { LfService } from '@/modules/lf/segments/lf-segments-service';
import pluralize from 'pluralize';
import debounce from 'lodash/debounce';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';

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

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);
const { updateSelectedProjectGroup } = lsSegmentsStore;

const searchQuery = ref('');
const isPopoverVisible = ref(false);
const projectGroupsList = ref([]);
const loading = ref(false);
const isSearchVisible = ref(false);

const { trackEvent } = useProductTracking();

const model = computed({
  get() {
    return selectedProjectGroup.value?.name;
  },
  set(id) {
    updateSelectedProjectGroup(id);
  },
});

const queryProjectGroups = async () => {
  loading.value = true;

  return LfService.queryProjectGroups({
    limit: null,
    offset: 0,
    filter: {
      name: searchQuery.value,
    },
  }).then(({ rows }) => {
    projectGroupsList.value = rows;
    if (searchQuery.value.length === 0 && rows.length > 5) {
      isSearchVisible.value = true;
    }
  }).finally(() => {
    loading.value = false;
  });
};

const onShow = () => {
  isPopoverVisible.value = true;
  queryProjectGroups();
};

const onHide = () => {
  isPopoverVisible.value = false;
  loading.value = true;
};

onMounted(() => {
  queryProjectGroups().then(() => {
    loading.value = true;
  });
});

const onSearchProjects = debounce(() => {
  queryProjectGroups();
}, 300);

const onOptionClick = ({ id, name }) => {
  trackEvent({
    key: FeatureEventKey.SELECT_PROJECT_GROUP,
    type: EventType.FEATURE,
    properties: {
      projectGroupId: id,
      projectName: name,
    },
  });

  isPopoverVisible.value = false;
  updateSelectedProjectGroup(id);
};
</script>

<script>
export default {
  name: 'AppLfSubProjectsGroupSelection',
};
</script>

<style lang="scss">
.project-groups-select-popper.el-popper {
    max-width: 236px;
    max-height: 480px;
    overflow: auto;
    @apply p-0;
}

.project-groups-select-input {
    @apply cursor-pointer relative w-full;
    height: 32px !important;

    .el-input__wrapper {
      @apply rounded;
      @apply h-8 px-3;
    }

    .el-input__inner {
        @apply cursor-pointer text-xs truncate pr-6;
    }
}
</style>
