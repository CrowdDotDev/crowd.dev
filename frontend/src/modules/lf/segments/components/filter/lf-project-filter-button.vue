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
    popper-class="lf-project-filter-popper"
  >
    <app-lf-project-filter
      v-model:options="options"
      @on-change="onFilterChange"
      @on-search-change="onSearchQueryChange"
    />
    <div
      v-if="!shouldApplyImmeadiately"
      class="border-t border-gray-200 flex items-center justify-between -mx-2 py-3 px-4"
    >
      <el-button
        v-if="shouldShowReset"
        id="resetFilter"
        class="btn btn-link btn-link--primary"
        @click="handleReset"
      >
        Reset filter
      </el-button>
      <div v-else>
          &nbsp;
      </div>
      <div class="flex items-center">
        <el-button
          id="closeFilter"
          class="btn btn--transparent btn--sm mr-3"
          @click="handleCancel"
        >
          Cancel
        </el-button>
        <el-button
          id="applyFilter"
          class="btn btn--primary btn--sm"
          :disabled="shouldDisableApplyButton"
          data-qa="filter-apply"
          @click="handleApply"
        >
          Apply
        </el-button>
      </div>
    </div>
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
import isEqual from 'lodash/isEqual';

const props = defineProps({
  segments: {
    type: Object,
    default: () => {},
  },
  setSegments: {
    type: Function,
    default: () => {},
  },
  btnClass: {
    type: String,
    default: null,
  },
  shouldApplyImmeadiately: {
    type: Boolean,
    default: true,
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
const provisionalSegments = ref({
  segments: [],
  childSegments: [],
});

// If current selected project group changes, fetch new list of projects and clear selected filters
watch(
  selectedProjectGroup,
  (updatedSelectedProjectGroup, oldSelectedProjectGroup) => {
    if (updatedSelectedProjectGroup?.id !== oldSelectedProjectGroup?.id) {
      listProjects({ parentSlug: updatedSelectedProjectGroup.slug, reset: true });

      props.setSegments({
        segments: {
          segments: [],
          childSegments: [],
        },
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
    options.value = updatedProjects.list.map((p) => ({
      id: p.id,
      label: p.name,
      selected: props.segments.segments.includes(p.id),
      children: p.subprojects.map((sp) => ({
        id: sp.id,
        label: sp.name,
        selected: props.segments.childSegments.includes(sp.id) && props.segments.segments.includes(sp.id),
      })),
    }));

    if (!initialOptions.value.length) {
      initialOptions.value = options.value;
    }
  },
  {
    deep: true,
  },
);

const filterLabel = computed(() => {
  if (!props.segments.childSegments.length) {
    return {
      showTooltip: false,
      text: 'All',
      trimmedText: 'All',
    };
  }

  let text = [];

  initialOptions.value.forEach((project) => {
    const selectedSubprojects = project.children.filter(
      (sp) => props.segments.childSegments.includes(sp.id),
    ).map((sp) => sp.label);

    if (project.children.length === selectedSubprojects.length && !isEqual(props.segments.segments, props.segments.childSegments)) {
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
  listProjects({ parentSlug: selectedProjectGroup.value.slug, reset: true });
});

const openFilterPopover = () => {
  isFilterPopoverVisible.value = true;
};

const onFilterChange = (value) => {
  const segments = { ...props.segments };

  value.forEach((option) => {
    if (option.selected) {
      segments.childSegments = option.children.map((c) => c.id);
      segments.segments = [option.id];
    } else {
      option.children.forEach((child) => {
        if (child.selected) {
          segments.childSegments = [child.id];
          segments.segments = [child.id];
        }
      });
    }
  });

  if (props.shouldApplyImmeadiately) {
    props.setSegments({
      segments,
    });
  } else {
    provisionalSegments.value = segments;
  }
};

const onSearchQueryChange = debounce((value) => {
  listProjects({ parentSlug: selectedProjectGroup.value.slug, search: value, reset: true });
}, 300);

const shouldShowReset = computed(() => !!props.segments.segments.length);
const shouldDisableApplyButton = computed(() => isEqual(initialOptions.value, options.value));

const handleCancel = () => {
  isFilterPopoverVisible.value = false;
  options.value = initialOptions.value;
};

const handleReset = () => {
  props.setSegments({
    segments: {
      segments: [],
      childSegments: [],
    },
  });

  isFilterPopoverVisible.value = false;
  options.value = initialOptions.value;
};

const handleApply = () => {
  props.setSegments({
    segments: provisionalSegments.value,
  });
  isFilterPopoverVisible.value = false;
};
</script>

<script>
export default {
  name: 'AppLfProjectFilterButton',
};
</script>

<style lang="scss">
.lf-project-filter-popper.el-popper {
    width: 320px;
    max-height: 480px;
    overflow: auto;
    @apply p-0;
}

.lf-filter-input {
  @apply h-10;

  .el-input__wrapper {
    @apply px-4;
  }
}
</style>
