<template>
  <span :data-tooltip="filterLabel.showTooltip ? filterLabel.text : null" data-tooltip-placement="top">
    <el-button
      ref="buttonRef"
      :class="btnClass || 'btn btn--bordered bg-white !py-1.5 !px-3 outline-none'"
      @click="openFilterPopover"
    >
      <div class="flex items-center text-xs">
        <i class="ri-stack-line text-base text-gray-900 mr-2" />
        <span class="font-medium text-gray-900">Projects:</span>
        <span class="text-gray-600 pl-1">{{ filterLabel.trimmedText }}</span>
      </div>
    </el-button>
  </span>

  <el-popover
    ref="filterPopover"
    v-model:visible="isFilterPopoverVisible"
    :virtual-ref="buttonRef"
    placement="bottom-start"
    width="320"
    trigger="manual"
    virtual-triggering
    popper-class="!p-2 overflow-hidden"
  >
    <app-lf-project-filter
      v-model:options="options"
      @on-change="onFilterChange"
      @on-search-change="onSearchQueryChange"
    />
  </el-popover>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import {
  computed,
  onMounted, ref, watch,
} from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppLfProjectFilter from '@/modules/lf/segments/components/filter/lf-project-filter.vue';
import debounce from 'lodash/debounce';

const props = defineProps({
  segments: {
    type: Array,
    default: () => [],
  },
  setSegments: {
    type: Function,
    default: () => {},
  },
  btnClass: {
    type: String,
    default: null,
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup, projects } = storeToRefs(lsSegmentsStore);
const { listProjects } = lsSegmentsStore;

const buttonRef = ref();
const isFilterPopoverVisible = ref(false);
const filterPopover = ref();

const initialOptions = ref([]);
const options = ref([]);

// If current selected project group changes, fetch new list of projects and clear selected filters
watch(
  selectedProjectGroup,
  (updatedSelectedProjectGroup, oldSelectedProjectGroup) => {
    if (updatedSelectedProjectGroup?.id !== oldSelectedProjectGroup?.id) {
      listProjects({ parentSlug: updatedSelectedProjectGroup.slug });

      props.setSegments({
        segments: [],
      });
    }
  },
  {
    deep: true,
  },
);

watch(
  projects,
  (updatedProjects) => {
    options.value = updatedProjects.list.map((p) => {
      const selectedSubProjects = p.subprojects.filter((subproject) => props.segments.includes(subproject.id));

      return {
        id: p.id,
        label: p.name,
        selected: !!selectedSubProjects.length,
        indeterminate:
            selectedSubProjects.length > 0
            && selectedSubProjects.length < p.subprojects.length,
        selectedChildren: selectedSubProjects.map((subproject) => subproject.name),
        children: p.subprojects.map((sp) => ({
          id: sp.id,
          label: sp.name,
        })),
      };
    });

    if (!initialOptions.value.length) {
      initialOptions.value = options.value;
    }
  },
  {
    deep: true,
  },
);

const filterLabel = computed(() => {
  if (!props.segments.length) {
    return {
      showTooltip: false,
      text: 'All',
      trimmedText: 'All',
    };
  }

  let text = [];

  initialOptions.value.forEach((project) => {
    const selectedSubprojects = project.children.filter(
      (sp) => props.segments.includes(sp.id),
    ).map((sp) => sp.label);

    if (project.children.length === selectedSubprojects.length) {
      text.push(`${project.label} (all sub-projects)`);
    } else if (selectedSubprojects.length) {
      text.push(`${selectedSubprojects.join(', ')} (${project.label})`);
    }
  });

  text = text.join(', ');

  const trimmedText = text.substring(0, 40);
  const showTooltip = trimmedText.length < text.length;

  return {
    showTooltip,
    text,
    trimmedText: showTooltip ? `${trimmedText}...` : text,
  };
});

onMounted(() => {
  listProjects({ parentSlug: selectedProjectGroup.value.slug });
});

const openFilterPopover = () => {
  isFilterPopoverVisible.value = true;
};

const onFilterChange = (value) => {
  const segments = [...props.segments];

  value.forEach((option) => {
    option.children.forEach((child) => {
      if (option.selectedChildren.includes(child.label) && !segments.includes(child.id)) {
        segments.push(child.id);
      } else if (!option.selectedChildren.includes(child.label)) {
        const segmentIndex = segments.findIndex((a) => a === child.id);

        if (segmentIndex !== -1) {
          segments.splice(segmentIndex, 1);
        }
      }
    });
  });

  props.setSegments({
    segments,
  });
};

const onSearchQueryChange = debounce((value) => {
  listProjects({ parentSlug: selectedProjectGroup.value.slug, search: value });
}, 300);
</script>

<script>
export default {
  name: 'AppLfProjectFilterButton',
};
</script>

  <style lang="scss">
  .lf-filter-input {
    @apply h-8;

    .el-input__wrapper {
      @apply px-2;
    }
  }
  </style>
