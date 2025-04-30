<template>
  <div class="relative not-clickable !px-0 !pt-0 !pb-6">
    <lf-table class="!overflow-visible" show-hover>
      <thead>
        <tr>
          <lf-table-head class="pl-2 w-20">
            Status
          </lf-table-head>
          <lf-table-head class="pl-3 min-w-35">
            Project group
          </lf-table-head>
          <lf-table-head>
            Projects
          </lf-table-head>
          <lf-table-head class="w-12" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="projectGroup in projectGroups.list" :key="projectGroup.id" class="cursor-pointer" @click="handleRowClick(projectGroup)">
          <lf-table-cell class="pl-2">
            <app-lf-status-pill :status="projectGroup.status" class="w-20" />
          </lf-table-cell>
          <lf-table-cell class="pl-3">
            <div class="text-sm font-semibold">
              {{ projectGroup.name }}
            </div>
          </lf-table-cell>
          <lf-table-cell>
            <app-lf-project-column :projects="projectGroup.projects" />
          </lf-table-cell>
          <lf-table-cell class="pr-2 flex justify-end">
            <app-lf-project-groups-dropdown
              :id="projectGroup.id"
              @on-edit-project-group="emit('onEditProjectGroup', projectGroup.id)"
              @on-add-project="emit('onAddProject', projectGroup.slug)"
            />
          </lf-table-cell>
        </tr>
      </tbody>
    </lf-table>

    <div v-if="!!pagination.count && !projectGroups.loading">
      <app-infinite-pagination
        :total="pagination.count"
        :page-size="Number(pagination.pageSize)"
        :current-page="pagination.currentPage || 1"
        :is-loading="projectGroups.paginating"
        :use-slot="true"
        @load-more="onLoadMore"
      >
        <div
          class="pt-10 pb-6 gap-4 flex justify-center items-center"
        >
          <p class="text-small text-gray-400">
            {{ projectGroups.list.length }} of {{ pagination.total }} project groups
          </p>
          <lf-button
            type="primary-ghost"
            loading-text="Loading project groups..."
            :loading="projectGroups.paginating"
            @click="onLoadMore(pagination.currentPage + 1)"
          >
            Load more
          </lf-button>
        </div>
      </app-infinite-pagination>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppLfProjectGroupsDropdown from '@/modules/admin/modules/projects/components/lf-project-groups-dropdown.vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import LfButton from '@/ui-kit/button/Button.vue';
import LfTable from '@/ui-kit/table/Table.vue';
import LfTableCell from '@/ui-kit/table/TableCell.vue';
import LfTableHead from '@/ui-kit/table/TableHead.vue';
import AppLfProjectColumn from '@/shared/project-column/lf-project-column.vue';
import AppLfStatusPill from '../fragments/lf-status-pill.vue';

const emit = defineEmits(['onEditProjectGroup', 'onAddProject']);
const router = useRouter();

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups } = storeToRefs(lsSegmentsStore);
const { doChangeProjectGroupCurrentPage, searchProjectGroup } = lsSegmentsStore;

const pagination = computed(() => projectGroups.value.pagination);

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
});

const onLoadMore = (currentPage) => {
  if (!projectGroups.value.paginating) {
    if (props.search && props.search !== '') {
      searchProjectGroup(props.search, undefined, undefined, currentPage);
    } else {
      doChangeProjectGroupCurrentPage(currentPage);
    }
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
