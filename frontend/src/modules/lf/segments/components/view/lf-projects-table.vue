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
      class-name="table-columns !py-0 !bg-white"
    >
      <template #header>
        <div>
          <span class="pt-1.5 pb-3 block">Connected Integrations</span>
          <div class="flex items-center h-8 mb-4">
            <span class="text-gray-400 text-sm normal-case font-normal">-</span>
          </div>
        </div>
      </template>
      <template #default="{ row }">
        <div
          v-if="row.integrations?.length"
          class="flex gap-1 items-center py-2"
        >
          <div
            v-for="integration in row.integrations"
            :key="integration.id"
          >
            <el-popover
              :disabled="integration.status !== 'in-progress' || !getProgress(row.id, integration.platform)"
              :width="320"
              placement="top"
            >
              <template #reference>
                <div class="relative w-6 h-6 flex items-center justify-center">
                  <app-platform-svg
                    :platform="integration.platform"
                  />

                  <i
                    v-if="integration.status === 'no-data'"
                    class="ri-alert-fill absolute right-0 top-0 text-2xs leading-3 text-yellow-500"
                  />
                  <i
                    v-else-if="integration.status === 'error'"
                    class="ri-error-warning-fill absolute right-0 top-0 text-2xs leading-3 text-red-600"
                  />
                  <div
                    v-else-if="integration.status === 'in-progress'"
                    class="w-4 h-4 bg-white rounded-full -ml-2 flex items-center justify-center -mt-5"
                  >
                    <cr-spinner size="0.75rem" class="!border-black" />
                  </div>
                </div>
              </template>
              <div class="px-1">
                <app-integration-progress :progress="getProgress(row.id, integration.platform)" :show-bar="true">
                  <h6 class="text-xs text-black leading-5 pb-3">
                    Connecting {{ CrowdIntegrations.getConfig(integration.platform)?.name }} integration
                  </h6>
                </app-integration-progress>
              </div>
            </el-popover>
          </div>
        </div>
        <span v-else class="text-gray-400 text-sm">No integrations</span>
      </template>
    </el-table-column>

    <!-- Status -->
    <el-table-column
      width="150"
      class-name="table-columns !bg-white"
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

    <el-table-column class-name="!bg-white">
      <template #default>
        <div class="flex grow" />
      </template>
    </el-table-column>

    <el-table-column fixed="right" width="288" class-name="table-columns !bg-white">
      <template #header>
        <span class="h-10 block" />
        <div class="flex justify-end mb-4">
          <app-lf-projects-dropdown
            :id="project.id"
            @on-edit-project="emit('onEditProject', project.id)"
            @on-add-sub-project="emit('onAddSubProject', project.slug)"
          />
        </div>
      </template>
      <template #default="{ row }">
        <div v-if="hasAccessToSegmentId(row.id)" class="h-10 items-center flex justify-end gap-3">
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

    <template v-if="project.subprojects?.length && (hasPermissionToCreateSubProject && hasAccessToSegmentId(project.id))" #append>
      <div class="w-full flex justify-start p-6">
        <el-button class="btn btn-link btn-link--primary" @click="emit('onAddSubProject', project.slug)">
          + Add sub-project
        </el-button>
      </div>
    </template>

    <template v-if="(hasPermissionToCreateSubProject && hasAccessToSegmentId(project.id))" #empty>
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
import { useRoute } from 'vue-router';
import { LfPermissions } from '@/modules/lf/lf-permissions';
import { computed } from 'vue';
import AppPlatformSvg from '@/shared/modules/platform/components/platform-svg.vue';
import { hasAccessToSegmentId } from '@/utils/segments';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import CrSpinner from '@/ui-kit/spinner/Spinner.vue';
import AppIntegrationProgress from '@/modules/integration/components/integration-progress.vue';
import { CrowdIntegrations } from '../../../../../integrations/integrations-config';

const route = useRoute();

const emit = defineEmits(['onEditProject', 'onEditSubProject', 'onAddSubProject']);
const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
  progress: {
    type: Array,
    required: false,
    default: () => ([]),
  },
});

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

const hasPermissionToCreateSubProject = computed(() => new LfPermissions(
  tenant.value,
  user.value,
)?.createSubProject);

const statusDisplay = (status) => statusOptions.find((s) => s.value === status);

const getProgress = (segmentId, platform) => (props.progress || []).find((p) => p.segmentId === segmentId && p.type === platform);
</script>

<script>
export default {
  name: 'AppLfProjectsTable',
};
</script>

<style lang="scss">
#projects-table {
  @apply rounded-md shadow;
  border: 1px solid #E5E7EB;

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

  .el-table__append-wrapper {
    position: sticky !important;
    left: 0px !important;
    width: fit-content;
  }
}
</style>
