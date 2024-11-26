<template>
  <div class="pt-6">
    <div class="flex gap-4">
      <!-- Search input -->
      <app-lf-search-input
        v-if="pagination.total"
        placeholder="Search project groups..."
        @on-change="onSearchProjectGroup"
      />
      <el-button
        v-if="pagination.total && hasPermission(LfPermission.projectGroupCreate)"
        class="btn btn--md btn--text"
        @click="onAddProjectGroup"
      >
        <lf-icon name="folder-plus" type="regular" class="mr-1.5" />
        Add project group
      </el-button>
    </div>

    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5 mt-10"
    />
    <div v-else>
      <!-- Empty state -->
      <app-empty-state-cta
        v-if="!pagination.total"
        class="mt-20"
        icon="folders"
        title="No project groups yet"
        :description="`${!hasPermission(LfPermission.projectGroupCreate)
          ? 'Ask an administrator to c' : 'C'}reate your first project group and start integrating your projects`"
        :cta-btn="hasPermission(LfPermission.projectGroupCreate) ? 'Add project group' : null"
        @cta-click="onAddProjectGroup"
      />

      <app-empty-state-cta
        v-else-if="!pagination.count"
        icon="folders"
        title="No project groups found"
        description="We couldn't find any results that match your search criteria, please try a different query"
      />

      <!-- Table -->
      <div v-else class="mt-8">
        <app-lf-project-groups-table
          @on-edit-project-group="onEditProjectGroup"
          @on-add-project="onAddProject"
        />
      </div>
    </div>

    <app-lf-project-group-form
      v-if="isProjectGroupFormDrawerOpen"
      :id="projectGroupForm.id"
      v-model="isProjectGroupFormDrawerOpen"
    />

    <app-lf-project-form
      v-if="isProjectFormDrawerOpen"
      v-model="isProjectFormDrawerOpen"
      :parent-slug="projectGroupForm.parentSlug"
    />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppLfProjectGroupForm from '@/modules/lf/segments/components/form/lf-project-group-form.vue';
import AppLfProjectForm from '@/modules/lf/segments/components/form/lf-project-form.vue';
import AppLfProjectGroupsTable from '@/modules/lf/segments/components/view/lf-project-groups-table.vue';
import AppLfSearchInput from '@/modules/lf/segments/components/view/lf-search-input.vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { LfRole } from '@/shared/modules/permissions/types/Roles';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups } = storeToRefs(lsSegmentsStore);
const { listProjectGroups, searchProjectGroup, updateSelectedProjectGroup } = lsSegmentsStore;

const authStore = useAuthStore();
const { roles } = storeToRefs(authStore);

const { trackEvent } = useProductTracking();
const { hasPermission } = usePermissions();

const loading = computed(() => projectGroups.value.loading);
const pagination = computed(() => projectGroups.value.pagination);

const projectGroupForm = reactive({
  id: null,
  parentSlug: null,
});
const isProjectGroupFormDrawerOpen = ref(false);
const isProjectFormDrawerOpen = ref(false);

const isProjectAdminUser = computed(() => roles.value.includes(LfRole.projectAdmin));

onMounted(() => {
  updateSelectedProjectGroup(null);
  listProjectGroups({
    reset: true,
    adminOnly: isProjectAdminUser.value || null,
  });
});

const onAddProject = (parentSlug) => {
  projectGroupForm.parentSlug = parentSlug;
  isProjectFormDrawerOpen.value = true;
};

const onAddProjectGroup = () => {
  projectGroupForm.id = null;
  isProjectGroupFormDrawerOpen.value = true;
};

const onEditProjectGroup = (id) => {
  projectGroupForm.id = id;
  isProjectGroupFormDrawerOpen.value = true;
};

const onSearchProjectGroup = (val) => {
  trackEvent({
    key: FeatureEventKey.SEARCH_PROJECT_GROUPS,
    type: EventType.FEATURE,
  });

  searchProjectGroup(val);
};
</script>

<script>
export default {
  name: 'AppLfProjectGroupsPage',
};
</script>
