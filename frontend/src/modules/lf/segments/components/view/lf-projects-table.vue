<template>
  <el-table
    id="projects-table"
    ref="table"
    :data="project.subprojects"
    row-key="id"
    :resizable="false"
  >
    <!-- Name -->
    <el-table-column
      prop="name"
      width="300"
      fixed
      class-name="table-columns !bg-white"
    >
      <template #header>
        <div>
          <div
            class="text-base font-semibold text-gray-900 normal-case flex items-center h-8 mb-4"
          >
            {{ project.name }}
          </div>
        </div>
      </template>
      <template #default="{ row }">
        <span class="text-gray-900 text-sm">{{ row.name }}</span>
      </template>
    </el-table-column>

    <!-- Connected Integrations -->
    <el-table-column width="250" class-name="table-columns !py-0 !bg-white">
      <template #header>
        <div>
          <div class="flex items-center h-8 mb-4">
            <span class="text-gray-400 text-sm normal-case font-normal">-</span>
          </div>
        </div>
      </template>
      <template #default="{ row }">
        <app-lf-project-integration-column
          :segment-id="row.id"
          :integrations="row.integrations"
          :progress="props.progress"
          :progress-error="progressError"
        />
      </template>
    </el-table-column>

    <!-- Status -->
    <el-table-column width="150" class-name="table-columns !bg-white">
      <template #header>
        <div>
          <div class="flex items-center gap-3 h-8 mb-4">
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="statusDisplay(project.status)?.color"
            />
            <span class="normal-case text-gray-900 font-normal text-sm">
              {{ statusDisplay(project.status)?.label }}
            </span>
          </div>
        </div>
      </template>
      <template #default="{ row }">
        <div class="flex items-center gap-3">
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="statusDisplay(row.status)?.color"
          />
          <span class="text-gray-900">
            {{ statusDisplay(row.status)?.label }}
          </span>
        </div>
      </template>
    </el-table-column>

    <el-table-column class-name="!bg-white">
      <template #default>
        <div class="flex grow" />
      </template>
    </el-table-column>

    <el-table-column
      fixed="right"
      width="288"
      class-name="table-columns !bg-white"
    >
      <template #header>
        <span class="h-10 block" />
        <div class="flex justify-end mb-4">
          <app-lf-projects-dropdown
            :id="project.id"
            @on-edit-project="emit('onEditProject', project.id)"
            @on-add-sub-project="emit('onAddSubProject', project)"
          />
        </div>
      </template>
      <template #default="{ row }">
        <div
          v-if="hasAccessToSegmentId(row.id)"
          class="h-10 items-center flex justify-end gap-3"
        >
          <router-link
            :to="{
              name: 'integration',
              params: {
                id: row.id,
                grandparentId: route.params.id,
              },
            }"
          >
            <el-button class="btn btn--secondary">
              Manage integrations
            </el-button>
          </router-link>
          <app-lf-sub-projects-dropdown
            :id="row.id"
            @on-edit-sub-project="emit('onEditSubProject', row.id)"
          />
        </div>
      </template>
    </el-table-column>

    <template
      v-if="
        project.subprojects?.length
          && hasPermission(LfPermission.subProjectCreate)
          && hasAccessToSegmentId(project.id)
      "
      #append
    >
      <div class="w-full flex justify-start p-6">
        <el-button
          class="btn btn-link btn-link--primary"
          @click="emit('onAddSubProject', project)"
        >
          + Add sub-project
        </el-button>
      </div>
    </template>

    <template
      v-if="
        hasPermission(LfPermission.subProjectCreate)
          && hasAccessToSegmentId(project.id)
      "
      #empty
    >
      <div class="w-full flex justify-start p-6">
        <el-button
          class="btn btn-link btn-link--primary"
          @click="emit('onAddSubProject', project)"
        >
          + Add sub-project
        </el-button>
      </div>
    </template>
  </el-table>
</template>

<script setup>
import statusOptions from '@/modules/lf/config/status';
import AppLfProjectsDropdown from '@/modules/lf/segments/components/lf-projects-dropdown.vue';
import AppLfSubProjectsDropdown from '@/modules/lf/segments/components/lf-sub-projects-dropdown.vue';
import { useRoute } from 'vue-router';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import AppLfProjectIntegrationColumn from '../fragments/lf-project-integration-column.vue';

const route = useRoute();

const emit = defineEmits([
  'onEditProject',
  'onEditSubProject',
  'onAddSubProject',
]);
const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
  progress: {
    type: Array,
    required: false,
    default: () => [],
  },
  progressError: {
    type: Boolean,
    default: false,
  },
});

const { hasPermission, hasAccessToSegmentId } = usePermissions();

const statusDisplay = (status) => statusOptions.find((s) => s.value === status);

</script>

<script>
export default {
  name: 'AppLfProjectsTable',
};
</script>

<style lang="scss">
#projects-table {
  @apply rounded-md shadow;
  border: 1px solid #e5e7eb;

  thead .table-columns {
    @apply align-top h-auto px-6;

    .cell {
      @apply px-0;
    }
  }

  tbody {
    tr td:last-child {
      @apply px-6;
    }

    .table-columns {
      @apply align-middle h-14 px-6;

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
    @apply w-full;
  }

  .el-table__append-wrapper {
    position: sticky !important;
    left: 0px !important;
    width: fit-content;
  }
}
</style>
