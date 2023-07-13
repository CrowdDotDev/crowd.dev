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

  <div class="app-list-table not-clickable panel !px-0 !pt-0 !pb-6">
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
        width="300"
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
        width="300"
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
        width="150"
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

      <el-table-column>
        <template #default>
          <div class="flex grow" />
        </template>
      </el-table-column>

      <el-table-column fixed="right" width="268">
        <template #default="{ row }">
          <div class="w-full flex justify-end gap-3">
            <router-link
              class="h-10 flex items-center"
              :to="{
                name: 'adminProjects',
                params: { id: row.id },
              }"
            >
              <el-button class="btn btn--secondary">
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

    <div v-if="!!pagination.count" class="mt-8 px-6">
      <app-pagination
        :total="pagination.count"
        :page-size="Number(pagination.pageSize)"
        :current-page="pagination.currentPage || 1"
        module="project group"
        @change-current-page="doChangeProjectGroupCurrentPage"
        @change-page-size="onPageSizeChange"
      />
    </div>
  </div>
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
const { updateProjectGroupsPageSize, doChangeProjectGroupCurrentPage } = lsSegmentsStore;

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
  thead .table-columns {
    @apply align-middle h-14 px-6;

    .cell {
      @apply px-0;
    }
  }

  tbody {
    tr td:last-child{
      @apply px-6;
    }

    .table-columns {
      @apply align-middle h-20 px-6;

      &.el-table-fixed-column--right .cell {
          @apply justify-end;
        }
    }

    .cell {
      @apply px-0;
      display: flex !important;
      align-items: center !important;
    }
  }

  .el-table__empty-text {
    @apply w-full
  }
}
</style>
