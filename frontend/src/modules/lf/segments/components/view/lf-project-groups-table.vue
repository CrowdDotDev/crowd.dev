<template>
  <div class="mb-6 h-10 flex items-center">
    <app-pagination-sorter
      :page-size="pagination.pageSize"
      :total="pagination.total"
      :current-page="pagination.currentPage"
      :has-page-counter="false"
      position="top"
      module="project group"
      @change-sorter="onPageSizeChange"
    />
  </div>

  <el-table
    id="project-groups-table"
    ref="table"
    :data="list"
    row-key="id"
    :resizable="false"
  >
    <!-- Name -->
    <el-table-column
      label="Project Group"
      prop="name"
      min-width="25"
      fixed
      class-name="table-columns"
    >
      <template #default="{ row }">
        <span class="text-gray-900 text-sm font-semibold">{{ row.name }}</span>
      </template>
    </el-table-column>

    <!-- Projects -->
    <el-table-column
      label="Projects"
      prop="projects"
      min-width="25"
      class-name="table-columns"
    >
      <template #default="{ row }">
        <div v-if="row.projects.length" class="flex flex-wrap gap-2">
          <app-tags
            :tags="row.projects.map((p) => p.name)"
            :collapse-tags="true"
            :collapse-tags-tooltip="true"
            tag-class="badge--gray-light h-6 text-xs"
          />
        </div>
        <span v-else class="text-gray-500 text-sm">No projects</span>
      </template>
    </el-table-column>

    <!-- Status -->
    <el-table-column
      label="Status"
      prop="status"
      min-width="15"
      class-name="table-columns"
    >
      <template #default="{ row }">
        <div class="flex items-center gap-3">
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="statusDisplay(row.status).color"
          />
          {{ statusDisplay(row.status).label }}
        </div>
      </template>
    </el-table-column>

    <el-table-column fixed="right" min-width="25">
      <template #default="{ row }">
        <div class="w-full flex justify-end gap-3">
          <router-link
            class="h-10 flex items-center"
            :to="{
              name: 'adminProjects',
              params: { id: row.id },
            }"
          >
            <el-button class="btn btn--bordered">
              <i class="ri-stack-line" />
              <span>Manage projects</span>
            </el-button>
          </router-link>
          <app-lf-project-groups-dropdown
            :id="row.id"
            @on-edit-project-group="emit('onEditProjectGroup', row.id)"
            @on-add-project="emit('onAddProject', row.slug)"
          />
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import statusOptions from '@/modules/lf/config/status';
import AppLfProjectGroupsDropdown from '@/modules/lf/segments/components/lf-project-groups-dropdown.vue';
import AppTags from '@/shared/tags/tags.vue';
import { computed } from 'vue';

const emit = defineEmits(['onEditProjectGroup', 'onAddProject']);

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups } = storeToRefs(lsSegmentsStore);
const { updateProjectGroupsPageSize } = lsSegmentsStore;

const pagination = computed(() => projectGroups.value.pagination);
const list = computed(() => projectGroups.value.list);

const statusDisplay = (status) => statusOptions.find((s) => s.value === status);

const onPageSizeChange = (pageSize) => {
  updateProjectGroupsPageSize(pageSize);
};
</script>

<script>
export default {
  name: 'AppLfProjectGroupsTable',
};
</script>

<style lang="scss">
#project-groups-table {
  @apply rounded-lg shadow;

  thead .table-columns {
    @apply align-middle h-14;
  }

  tbody {
    .table-columns {
      @apply align-middle h-20;
    }

    .cell {
      display: flex !important;
      align-items: center !important;
    }
  }
}
</style>
