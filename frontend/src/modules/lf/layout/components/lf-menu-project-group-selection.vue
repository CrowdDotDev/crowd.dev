<template>
  <el-select
    v-model="model"
    class="lf-project-group-selection w-full"
    placeholder="Select project group..."
    :loading="loading"
    popper-class="lf-project-group-selection-dropdown"
    fit-input-width
  >
    <template
      v-if="selectedProjectGroup && isUrl(selectedProjectGroup.url)"
      #prefix
    >
      <img
        class="max-w-5 max-h-5"
        :src="selectedProjectGroup.url"
        alt="Project group logo"
      />
    </template>
    <el-option
      v-for="projectGroup of list"
      :key="projectGroup.id"
      :label="projectGroup.name"
      :value="projectGroup.id"
      class="!pr-8 !pl-2 !h-14"
    >
      <div class="flex gap-2 items-start truncate">
        <img
          v-if="isUrl(projectGroup.url)"
          class="max-w-5 max-h-5"
          :src="projectGroup.url"
          alt="Project group logo"
        />
        <div class="block truncate mr-2">
          <div class="h-5 leading-5 text-xs text-gray-900 truncate">
            {{ projectGroup.name }}
          </div>
          <div class="h-5 leading-5 text-3xs text-gray-400">
            {{ pluralize("project", projectGroup.projects.length, true) }}
          </div>
        </div>
      </div>
    </el-option>
  </el-select>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import pluralize from 'pluralize';
import isUrl from '@/utils/isUrl';

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups, selectedProjectGroup } = storeToRefs(lsSegmentsStore);
const { listProjectGroups, updateSelectedProjectGroup } = lsSegmentsStore;

const loading = computed(() => projectGroups.value.loading);
const list = computed(() => projectGroups.value.list);

const model = computed({
  get() {
    return selectedProjectGroup.value?.id;
  },
  set(id) {
    updateSelectedProjectGroup(id);
  },
});

onMounted(() => {
  listProjectGroups();
});
</script>

<script>
export default {
  name: 'AppLfMenuProjectGroupSelection',
};
</script>

<style lang="scss">
.lf-project-group-selection {
  .el-input__inner {
    @apply text-xs truncate pr-6;
  }
}

.lf-project-group-selection-dropdown
  .el-select-dropdown
  .el-select-dropdown__item:not(.no-checkmark).selected::after {
  display: none;
}
</style>
