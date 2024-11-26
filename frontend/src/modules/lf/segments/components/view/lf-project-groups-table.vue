<template>
  <div class="app-list-table not-clickable !px-0 !pt-0 !pb-6">
    <el-table
      id="project-groups-table"
      ref="table"
      :data="list"
      row-key="id"
      :resizable="false"
      @row-click="handleRowClick"
    >
      <!-- Status -->
      <el-table-column
        label="Status"
        prop="status"
        width="100"
        class-name="table-columns"
      >
        <template #default="{ row }">
          <app-pill :color="statusDisplay(row.status).color" type="solid">
            {{ statusDisplay(row.status).label }}
          </app-pill>
        </template>
      </el-table-column>

      <!-- Name -->
      <el-table-column
        label="Project Group"
        prop="name"
        width="450"
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
        width="150"
        class-name="table-columns"
      >
        <template #default="{ row }">
          <div v-if="row.projects.length" class="flex flex-wrap gap-2">
            <app-pill color="bg-white text-gray-900" type="bordered">
              <div class="flex items-center gap-1">
              <lf-icon-old name="stack-line" />
              {{ row.projects.length }} project{{ row.projects.length > 1 ? 's' : '' }}
            </div>
            </app-pill>
          </div>
          <span v-else class="text-gray-500 text-sm">No projects</span>
        </template>
      </el-table-column>

      

      <el-table-column>
        <template #default>
          <div class="flex grow" />
        </template>
      </el-table-column>

      <el-table-column width="100">
        <template #default="{ row }">
          <div class="w-full flex justify-end gap-3">
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
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import AppPill from '@/shared/pill/pill.vue';

const emit = defineEmits(['onEditProjectGroup', 'onAddProject']);
const router = useRouter();

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups } = storeToRefs(lsSegmentsStore);
const { updateProjectGroupsPageSize, doChangeProjectGroupCurrentPage } = lsSegmentsStore;

const pagination = computed(() => projectGroups.value.pagination);
const list = computed(() => projectGroups.value.list);

const statusDisplay = (status) => statusOptions.find((s) => s.value === status);

const onPageSizeChange = (pageSize) => {
  updateProjectGroupsPageSize(pageSize);
};

const handleRowClick = (row) => {
  router.push({
    name: 'adminProjects',
    params: { id: row.id },
  });
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
    @apply align-middle h-14 px-2;

    .cell {
      @apply px-0 #{!important};
    }
  }

  tbody {
    tr {
      @apply cursor-pointer;
    }
    tr td:last-child{
      @apply px-6;
    }

    .table-columns {
      @apply align-middle h-20 px-2;

      &.el-table-fixed-column--right .cell {
          @apply justify-end;
          
        }
    }

    .cell {
      @apply px-0 #{!important};
    }
  }

  .el-table__empty-text {
    @apply w-full
  }
}
</style>
