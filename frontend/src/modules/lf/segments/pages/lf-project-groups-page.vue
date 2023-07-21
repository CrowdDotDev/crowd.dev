<template>
  <div class="pt-6">
    <div class="flex gap-4">
      <!-- Search input -->
      <app-lf-search-input
        v-if="pagination.total"
        placeholder="Search project groups..."
        @on-change="searchProjectGroup"
      />
      <el-button
        v-if="pagination.total && hasPermissionToCreate"
        class="btn btn--md btn--primary"
        @click="onAddProjectGroup"
      >
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
        icon="ri-folder-5-line"
        title="No project groups yet"
        description="Create your first project group and start integrating your projects"
        :cta-btn="hasPermissionToCreate ? 'Add project group' : null"
        @cta-click="onAddProjectGroup"
      />

      <app-empty-state-cta
        v-else-if="!pagination.count"
        icon="ri-folder-5-line"
        title="No project groups found"
        description="We couldn't find any results that match your search criteria, please try a different query"
      />

      <!-- Table -->
      <div v-else class="mt-6">
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
import { LfPermissions } from '@/modules/lf/lf-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { PermissionChecker } from '@/modules/user/permission-checker';
import Roles from '@/security/roles';

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups } = storeToRefs(lsSegmentsStore);
const { listProjectGroups, searchProjectGroup, updateSelectedProjectGroup } = lsSegmentsStore;

const { currentTenant, currentUser } = mapGetters('auth');

const loading = computed(() => projectGroups.value.loading);
const pagination = computed(() => projectGroups.value.pagination);

const projectGroupForm = reactive({
  id: null,
  parentSlug: null,
});
const isProjectGroupFormDrawerOpen = ref(false);
const isProjectFormDrawerOpen = ref(false);

const hasPermissionToCreate = computed(() => new LfPermissions(
  currentTenant.value,
  currentUser.value,
)?.createProjectGroup);

const isProjectAdminUser = computed(() => {
  const permissionChecker = new PermissionChecker(
    currentTenant.value,
    currentUser.value,
  );
  return permissionChecker.currentUserRolesIds.includes(Roles.values.projectAdmin);
});

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
</script>

<script>
export default {
  name: 'AppLfProjectGroupsPage',
};
</script>
