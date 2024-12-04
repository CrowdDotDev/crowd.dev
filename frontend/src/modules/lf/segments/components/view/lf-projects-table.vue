<template>
  <el-table
    id="projects-table"
    ref="table"
    :data="project.subprojects"
    row-key="id"
    :resizable="false"
  >
    <!-- Status -->
    <el-table-column width="130" class-name="table-columns !bg-white">
      <template #header>
        <app-lf-status-pill :status="project.status" />
      </template>
      <template #default="{ row }">
        <app-lf-status-pill :status="row.status" />
      </template>
    </el-table-column>

    <!-- Name -->
    <el-table-column
      prop="name"
      width="500"
      class-name="table-columns !bg-white"
    >
      <template #header>
        <div>
          <div
            class="text-medium font-semibold text-gray-900 normal-case flex items-center"
          >
            {{ project.name }}
          </div>
        </div>
      </template>
      <template #default="{ row }">
        <div class="flex items-center gap-5">
          <span class="text-gray-900 text-sm">{{ row.name }}</span>
          <app-lf-project-integration-column
            :segment-id="row.id"
            :integrations="row.integrations"
            :progress="props.progress"
            :progress-error="progressError"
          />
        </div>
      </template>
    </el-table-column>

    <el-table-column class-name="table-columns !bg-white">
      <template #header>
        <div class="flex grow" />
      </template>
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
        <div class="flex justify-end">
          <lf-button
            v-if="
              hasPermission(LfPermission.subProjectCreate)
                && hasAccessToSegmentId(project.id)
            "
            type="secondary-ghost"
            @click="emit('onAddSubProject', project)"
          >
            <lf-icon name="layer-plus" :size="16" type="regular" />
          </lf-button>
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
            <lf-button type="primary-ghost">
              <lf-icon name="grid-round-2" :size="16" type="regular" />
              Integrations
            </lf-button>
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
import AppLfProjectsDropdown from '@/modules/lf/segments/components/lf-projects-dropdown.vue';
import AppLfSubProjectsDropdown from '@/modules/lf/segments/components/lf-sub-projects-dropdown.vue';
import { useRoute } from 'vue-router';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import AppLfProjectIntegrationColumn from '../fragments/lf-project-integration-column.vue';
import AppLfStatusPill from '../fragments/lf-status-pill.vue';

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

</script>

<script>
export default {
  name: 'AppLfProjectsTable',
};
</script>

<style lang="scss">
#projects-table {
  @apply rounded-md shadow-sm border border-solid border-gray-200;

  thead .table-columns {
    @apply align-middle h-auto px-4 py-4;
    @apply normal-case bg-gray-50 #{!important};

    .cell {
      @apply px-0 #{!important};
    }
  }

  tbody {
    .table-columns {
      @apply align-middle px-4 py-4;

      &.el-table-fixed-column--right .cell {
        @apply justify-end;
      }
    }

    .cell {
      @apply px-0 #{!important};
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
