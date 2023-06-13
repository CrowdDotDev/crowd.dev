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
      class-name="table-columns"
    >
      <template #header>
        <div>
          <span class="pt-1.5 pb-3 block">Project</span>
          <div class="text-base font-semibold text-gray-900 normal-case flex items-center h-8 mb-4">
            {{ project.name }}
          </div>
        </div>
      </template>
      <template #default="{ row }">
        <span class="text-gray-900 text-sm">{{ row.name }}</span>
      </template>
    </el-table-column>

    <!-- Connected Integrations -->
    <el-table-column
      width="250"
      class-name="table-columns"
    >
      <template #header>
        <div>
          <span class="pt-1.5 pb-3 block">Connected Integrations</span>
          <div
            v-if="project.integrations?.length"
            class="flex gap-3 items-center h-8 mb-4"
          >
            <div
              v-for="platform in project.integrations"
              :key="platform"
            >
              <app-platform-svg-icon
                :platform="platform"
              />
            </div>
          </div>
          <div v-else class="flex items-center h-8 mb-4">
            <span class="text-gray-400 text-sm normal-case font-normal">No integrations</span>
          </div>
        </div>
      </template>
      <template #default="{ row }">
        <div
          v-if="row.integrations?.length"
          class="flex gap-3 items-center"
        >
          <div
            v-for="platform in row.integrations"
            :key="platform"
          >
            <app-platform-svg-icon
              :platform="platform"
            />
          </div>
        </div>
        <span class="text-gray-400 text-sm">No integrations</span>
      </template>
    </el-table-column>

    <!-- Status -->
    <el-table-column
      width="150"
      class-name="table-columns"
    >
      <template #header>
        <div>
          <span class="pt-1.5 pb-3 block">Status</span>
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

    <el-table-column>
      <template #default>
        <div class="flex grow" />
      </template>
    </el-table-column>

    <el-table-column fixed="right" width="268" class-name="table-columns">
      <template #header>
        <span class="h-10 block" />
        <div class="flex justify-end mb-4">
          <app-lf-projects-dropdown
            @on-edit-project="emit('onEditProject', project.id)"
            @on-add-sub-project="emit('onAddSubProject', project.slug)"
          />
        </div>
      </template>
      <template #default="{ row }">
        <div class="h-10 items-center flex justify-end gap-3">
          <router-link
            :to="{
              name: 'integration',
              params: { id: row.id },
            }"
          >
            <el-button class="btn btn--bordered">
              Manage integrations
            </el-button>
          </router-link>
          <app-lf-sub-projects-dropdown
            @on-edit-sub-project="emit('onEditSubProject', row.id)"
          />
        </div>
      </template>
    </el-table-column>

    <template v-if="project.subprojects?.length" #append>
      <div class="w-full flex justify-start p-6">
        <el-button class="btn btn-link btn-link--primary" @click="emit('onAddSubProject', project.slug)">
          + Add sub-project
        </el-button>
      </div>
    </template>

    <template #empty>
      <div class="w-full flex justify-start p-6">
        <el-button class="btn btn-link btn-link--primary" @click="emit('onAddSubProject', project.slug)">
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
import AppPlatformSvgIcon from '@/shared/platform/platform-svg-icon.vue';

const emit = defineEmits(['onEditProject', 'onEditSubProject', 'onAddSubProject']);
defineProps({
  project: {
    type: Object,
    required: true,
  },
});

const statusDisplay = (status) => statusOptions.find((s) => s.value === status);
</script>

<script>
export default {
  name: 'AppLfProjectsTable',
};
</script>

<style lang="scss">
#projects-table {
  @apply rounded-lg shadow;

  thead .table-columns {
    @apply align-top h-auto px-6;

    .cell {
      @apply px-0;
    }
  }

  tbody {
    tr td:last-child{
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
    @apply w-full
  }
}
</style>
