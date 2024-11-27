<template>
  <div class="app-list-table not-clickable !px-0 !pt-0 !pb-6">
    <el-table
      id="project-groups-table"
      ref="table"
      :data="fullList"
      row-key="id"
      :resizable="false"
      @row-click="handleRowClick"
    >
      <!-- Status -->
      <el-table-column
        label="Status"
        prop="status"
        width="110"
        class-name="table-columns"
      >
        <template #default="{ row }">
          <app-lf-status-pill :status="row.status" />
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
          <app-lf-project-column :projects="row.projects" />
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

    <div v-if="!!pagination.count && !projectGroups.loading" class="mt-8 px-6">
      <app-infinite-pagination 
        :total="pagination.count"
        :page-size="Number(pagination.pageSize)"
        :current-page="pagination.currentPage || 1"
        :is-loading="projectGroups.paginating"
        @load-more="onLoadMore"
      />
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppLfProjectGroupsDropdown from '@/modules/lf/segments/components/lf-project-groups-dropdown.vue';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppLfProjectColumn from '../fragments/lf-project-column.vue';
import AppLfStatusPill from '../fragments/lf-status-pill.vue';

const emit = defineEmits(['onEditProjectGroup', 'onAddProject']);
const router = useRouter();

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups } = storeToRefs(lsSegmentsStore);
const { doChangeProjectGroupCurrentPage } = lsSegmentsStore;

const pagination = computed(() => projectGroups.value.pagination);
const fullList = ref(projectGroups.value.list);
const currentPage = ref(1);

watch(projectGroups.value, (newList) => {
  // TODO: need to requirements on how to handle editing project groups.
  // The current implementation just re-fetches the current page, but if we edit a project group that is not in the current page
  // The table will appear outdated
  if (!newList.paginating && currentPage.value !== newList.pagination.currentPage) {
    currentPage.value = newList.pagination.currentPage;
    fullList.value = [...fullList.value, ...newList.list];
  }
});

// const onPageSizeChange = (pageSize) => {
//   updateProjectGroupsPageSize(pageSize);
// };

const onLoadMore = (currentPage) => {
  if (!projectGroups.value.paginating) {
    doChangeProjectGroupCurrentPage(currentPage);
  }
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
